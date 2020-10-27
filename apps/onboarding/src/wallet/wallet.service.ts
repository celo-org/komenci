import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RelayerProxyService } from '@app/onboarding/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import {
  InputDecodeError, InvalidChildMethod, InvalidDestination,
  InvalidImplementation,
  InvalidRootMethod,
  MetaTxValidationError, WalletError,
  WalletNotDeployed,
} from '@app/onboarding/wallet/errors'
import { Address, normalizeAddress, trimLeading0x } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { CeloTransactionObject } from '@celo/contractkit'
import { ABI as MetaTxWalletABI, MetaTransactionWallet, newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { ContractKit } from '@celo/contractkit/lib/kit'
import { RawTransaction, toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { WalletValidationError } from '@celo/komencikit/lib/errors'
import { verifyWallet } from '@celo/komencikit/lib/verifyWallet'
import { Inject, Injectable } from '@nestjs/common'
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
    session: Session,
    allowedTransactions: TxFilter[]
  ): Promise<Result<true, MetaTxValidationError>> {
    const metaTxDecode = this.decodeMetaTransaction(transaction)
    if (metaTxDecode.ok === false) {
      return metaTxDecode
    }

    const metaTx = metaTxDecode.result
    const normDestination = normalizeAddress(metaTx.destination)

    const txWithMatchingDestination = allowedTransactions.filter(
      (tx) =>
        normalizeAddress(tx.destination) === normDestination
    )

    if (txWithMatchingDestination.length === 0) {
      return Err(new InvalidDestination(metaTx.destination))
    }

    const metaTxMethodId = trimLeading0x(metaTx.data).slice(0, 8)
    const matchingTx = txWithMatchingDestination.find(
      (tx) => {
        const methodId = trimLeading0x(tx.methodId)
        return metaTxMethodId === methodId
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
  ): Promise<Result<true, WalletValidationError>> {
    return verifyWallet(
      this.contractKit,
      walletAddress,
      Object.keys(this.cfg.mtwImplementations),
      expectedSigner
    )
  }

  async getWallet(session: Session, implementationAddress: string): Promise<Result<string, WalletError>> {
    if (this.hasDeployInProgress(session, implementationAddress)) {
      const tx = await this.web3.eth.getTransaction(session.meta.walletDeploy.txHash)
      if (tx.blockNumber !== null) {
        const deployer = await this.contractKit.contracts.getMetaTransactionWalletDeployer(
          this.cfg.mtwDeployerAddress
        )
        const events = await deployer.getPastEvents('WalletDeployed', {
          fromBlock: tx.blockNumber,
          toBlock: tx.blockNumber,
        })

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

  async deployWallet(session: Session, implementationAddress: string): Promise<Result<string, WalletError>> {
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

    const result = await this.sessionService.update(session.id, {
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

  private hasDeployInProgress(session: Session, implementationAddress: string): boolean {
    if (
      session.meta &&
      session.meta.walletDeploy !== undefined &&
      session.meta.walletDeploy.txHash !== undefined &&
      session.meta.walletDeploy.implementationAddress === implementationAddress
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
    // const wallet = await this.contractKit.contracts.getMetaTransactionWallet(tx.destination)
    try {
      const decodedData = MetaTxWalletDecoder.decodeData(tx.data)
      if (decodedData.method !== 'executeMetaTransaction') {
        return Err(new InvalidRootMethod(decodedData.method))
      }

      return Ok({
        destination: decodedData.inputs[0],
        data: decodedData.inputs[1],
        value: decodedData.inputs[2],
      })
    } catch (e) {
      return Err(new InputDecodeError(e))
    }
  }
}
