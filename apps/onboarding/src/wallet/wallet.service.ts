import { extractMethodId, normalizeMethodId } from '@app/blockchain/utils'
import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RelayerProxyService } from '@app/onboarding/relayer/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import {
  InputDecodeError, InvalidChildMethod, InvalidDestination,
  InvalidImplementation,
  InvalidRootMethod,
  InvalidWallet,
  MetaTxValidationError,
  WalletNotDeployed
} from '@app/onboarding/wallet/errors'
import { Address, normalizeAddress, trimLeading0x } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { ABI as MetaTxWalletABI, newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { ContractKit } from '@celo/contractkit/lib/kit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { WalletValidationError } from '@celo/komencikit/lib/errors'
import { verifyWallet } from '@celo/komencikit/lib/verifyWallet'
import { Inject, Injectable } from '@nestjs/common'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'

const InputDataDecoder = require('ethereum-input-data-decoder')
const MetaTxWalletDecoder = new InputDataDecoder(MetaTxWalletABI)

export interface TxFilter {
  destination: Address,
  methodId: string
}

@Injectable()
export class WalletService {
  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly sessionService: SessionService,
    private readonly walletDeployer: MetaTransactionWalletDeployerWrapper,
    private readonly web3: Web3,
    private readonly contractKit: ContractKit,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  async isAllowedMetaTransaction(
    transaction: RawTransaction,
    allowedTransactions: TxFilter[]
  ): Promise<Result<true, MetaTxValidationError>> {
    const metaTxDecode = this.decodeMetaTransaction(transaction)
    if (metaTxDecode.ok === false) {
      return metaTxDecode
    }

    const metaTx = metaTxDecode.result
    const normDestination = normalizeAddress(metaTx.destination)

    const txWithMatchingDestination = allowedTransactions.filter(
      (allowed) =>
        normalizeAddress(allowed.destination) === normDestination
    )

    if (txWithMatchingDestination.length === 0) {
      return Err(new InvalidDestination(metaTx.destination))
    }

    const metaTxMethodId = extractMethodId(metaTx.data)
    const matchingTx = txWithMatchingDestination.find(
      (allowed) => {
        return metaTxMethodId === normalizeMethodId(allowed.methodId)
      }
    )

    if (matchingTx === undefined) {
      return Err(new InvalidChildMethod(metaTxMethodId))
    }

    return Ok(true)
  }

  async isValidWallet(
    walletAddress: Address,
    expectedSigner: Address
  ): Promise<Result<true, InvalidWallet>> {
    const valid = await verifyWallet(
      this.contractKit,
      walletAddress,
      Object.keys(this.cfg.mtwImplementations),
      expectedSigner
    )

    if (valid.ok !== true) {
      return Err(new InvalidWallet(valid.error))
    }

    return valid
  }

  async getWallet(session: Session, implementationAddress?: string): Promise<Result<string, WalletNotDeployed>> {
    if (this.hasDeployInProgress(session, implementationAddress)) {
      const tx = await this.web3.eth.getTransaction(session.meta.walletDeploy.txHash)
      if (tx.blockNumber !== null) {
        const events = await this.walletDeployer.getPastEvents(
          this.walletDeployer.eventTypes.WalletDeployed,
          {
            fromBlock: tx.blockNumber,
            toBlock: tx.blockNumber,
          }
        )

        const deployWalletLog = events.find((event) =>
          normalizeAddress(event.returnValues.owner) === normalizeAddress(session.externalAccount)
        )

        if (deployWalletLog) {
          return Ok(deployWalletLog.returnValues.wallet)
        }
      }
    }

    return Err(new WalletNotDeployed())
  }

  async deployWallet(session: Session, implementationAddress: string): Promise<Result<string, InvalidImplementation>> {
    if (!this.isValidImplementation(implementationAddress)) {
      return Err(new InvalidImplementation(implementationAddress))
    }

    if (this.hasDeployInProgress(session, implementationAddress)) {
      return Ok(session.meta.walletDeploy.txHash)
    }

    const impl = newMetaTransactionWallet(this.web3, implementationAddress)
    const resp = await this.relayerProxyService.submitTransaction({
      transaction: toRawTransaction(
        this.walletDeployer.deploy(
          session.externalAccount,
          implementationAddress,
          impl.methods.initialize(session.externalAccount).encodeABI()
        ).txo
      )
    })

    await this.sessionService.update(session.id, {
      meta: {
        ...session.meta,
        walletDeploy: {
          startedAt: Date.now(),
          txHash: resp.payload,
          implementationAddress,
        }
      }
    })

    return Ok(resp.payload)
  }

  private hasDeployInProgress(session: Session, implementationAddress?: string): boolean {
    if (
      session.meta?.walletDeploy?.txHash !== undefined &&
      (
        session.meta?.walletDeploy?.implementationAddress === implementationAddress ||
        implementationAddress === undefined
      )
    ) {
      const deployDeadline = new Date(
        session.meta.walletDeploy.startedAt +
        this.cfg.transactionTimeoutMs
      )

      if (new Date() < deployDeadline) {
        return true
      }
    }
    return false
  }

  private isValidImplementation(implementationAddress: string): boolean {
    return implementationAddress in this.cfg.mtwImplementations
  }

  private decodeMetaTransaction(tx: RawTransaction): Result<RawTransaction, MetaTxValidationError> {
    let decodedData: any
    try {
      decodedData = MetaTxWalletDecoder.decodeData(tx.data)
    } catch (e) {
      return Err(new InputDecodeError(e))
    }

    if (decodedData.method === null) {
      return Err(new InputDecodeError())
    }

    if (decodedData.method !== 'executeMetaTransaction') {
      return Err(new InvalidRootMethod(decodedData.method))
    }

    if (decodedData.inputs.length !== 6) {
      return Err(new InputDecodeError(new Error("Invalid inputs length")))
    }

    // destination, value, calldata
    const inputs: [string, any, Buffer] = decodedData.inputs
    return Ok({
      destination: inputs[0],
      value: inputs[1].toString(),
      data: inputs[2].toString('hex')
    })
  }
}
