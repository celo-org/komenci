import { extractMethodId, normalizeMethodId } from '@app/blockchain/utils'
import { DeployWalletTxSent, KomenciEventType, KomenciLoggerService } from '@app/komenci-logger'
import { RelayerProxyService } from '@app/onboarding/relayer/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import {
  InputDecodeError,
  InvalidChildMethod,
  InvalidDestination,
  InvalidImplementation,
  InvalidRootMethod,
  InvalidWallet,
  MetaTxValidationError,
  WalletNotDeployed
} from '@app/onboarding/wallet/errors'
import { networkConfig, NetworkConfig } from '@app/utils/config/network.config'
import { Address, normalizeAddress } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import {
  ABI as MetaTxWalletABI,
  newMetaTransactionWallet
} from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { ContractKit } from '@celo/contractkit/lib/kit'
import {
  RawTransaction,
  toRawTransaction
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { verifyWallet } from '@celo/komencikit/lib/verifyWallet'
import { Inject, Injectable } from '@nestjs/common'
import Web3 from 'web3'
import { AppConfig, appConfig } from '../config/app.config'

const InputDataDecoder = require('ethereum-input-data-decoder')
const MetaTxWalletDecoder = new InputDataDecoder(MetaTxWalletABI)

export interface TxFilter {
  destination: Address
  methodId: string
}

export interface MetaTxMetadata {
  destination: Address
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
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    @Inject(appConfig.KEY)
    private readonly appCfg: AppConfig,
    private readonly logger: KomenciLoggerService
  ) {}

  async isAllowedMetaTransaction(
    txMetadata: MetaTxMetadata,
    allowedTransactions: TxFilter[]
  ): Promise<Result<true, MetaTxValidationError>> {
    const normDestination = normalizeAddress(txMetadata.destination)

    const txWithMatchingDestination = allowedTransactions.filter(
      allowed => normalizeAddress(allowed.destination) === normDestination
    )

    if (txWithMatchingDestination.length === 0) {
      return Err(new InvalidDestination(txMetadata.destination))
    }

    const metaTxMethodId = txMetadata.methodId
    const matchingTx = txWithMatchingDestination.find(allowed => {
      return metaTxMethodId === normalizeMethodId(allowed.methodId)
    })
    if (matchingTx === undefined) {
      return Err(new InvalidChildMethod(metaTxMethodId))
    }

    return Ok(true)
  }

  async extractMetaTxData(
    transaction: RawTransaction
  ): Promise<Result<MetaTxMetadata, MetaTxValidationError>> {
    const metaTxDecode = this.decodeMetaTransaction(transaction)
    if (metaTxDecode.ok === false) {
      return metaTxDecode
    }
    const metaTx = metaTxDecode.result
    return Ok({
      destination: metaTx.destination,
      methodId: extractMethodId(metaTx.data)
    })
  }

  async isValidWallet(
    walletAddress: Address,
    expectedSigner: Address
  ): Promise<Result<true, InvalidWallet>> {
    const valid = await verifyWallet(
      this.contractKit,
      walletAddress,
      Object.keys(this.networkCfg.contracts.MetaTransactionWalletVersions),
      expectedSigner
    )

    if (valid.ok !== true) {
      return Err(new InvalidWallet(valid.error))
    }

    return valid
  }

  async getWallet(session: Session, implementationAddress?: string): Promise<Result<string, WalletNotDeployed>> {
    if (this.hasDeployInProgress(session, implementationAddress)) {
      const tx = await this.web3.eth.getTransaction(
        session.meta.walletDeploy.txHash
      )
      if (tx.blockNumber !== null) {
        const events = await this.walletDeployer.getPastEvents(
          this.walletDeployer.eventTypes.WalletDeployed,
          {
            fromBlock: tx.blockNumber,
            toBlock: tx.blockNumber
          }
        )

        const deployWalletLog = events.find(
          event =>
            normalizeAddress(event.returnValues.owner) ===
            normalizeAddress(session.externalAccount)
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
    const txn = toRawTransaction(
      this.walletDeployer.deploy(
        session.externalAccount,
        implementationAddress,
        impl.methods.initialize(session.externalAccount).encodeABI()
      ).txo
    )
    const resp = await this.relayerProxyService.submitTransaction({
      transaction: txn
    })

    this.logger.logEvent<DeployWalletTxSent>(KomenciEventType.DeployWalletTxSent, {
      txHash: resp.payload,
      sessionId: session.id,
      externalAccount: session.externalAccount
    })

    await this.sessionService.update(session.id, {
      meta: {
        ...session.meta,
        walletDeploy: {
          startedAt: Date.now(),
          txHash: resp.payload,
          implementationAddress
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
          this.appCfg.transactionTimeoutMs
      )

      if (new Date() < deployDeadline) {
        return true
      }
    }
    return false
  }

  private isValidImplementation(implementationAddress: string): boolean {
    return implementationAddress in this.networkCfg.contracts.MetaTransactionWalletVersions
  }

  private decodeMetaTransaction(
    tx: RawTransaction
  ): Result<RawTransaction, MetaTxValidationError> {
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
      return Err(new InputDecodeError(new Error('Invalid inputs length')))
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
