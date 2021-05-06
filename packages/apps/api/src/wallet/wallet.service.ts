import { Address, ensureLeading0x, normalizeAddress, throwIfError } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { ContractKit } from '@celo/contractkit/lib/kit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { networkConfig, NetworkConfig } from '@komenci/core'
import { verifyWallet } from '@komenci/kit/lib/verifyWallet'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Inject, Injectable, Scope } from '@nestjs/common'
import Web3 from 'web3'
import { AppConfig, appConfig } from '../config/app.config'
import { RelayerProxyService } from '../relayer/relayer_proxy.service'
import { Session } from '../session/session.entity'
import { SessionService } from '../session/session.service'
import {
  InvalidImplementation,
  InvalidWallet,
  WalletNotDeployed,
} from '../wallet/errors'

@Injectable({
  // RelayerProxyService is Request scoped
  scope: Scope.REQUEST
})
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
        ensureLeading0x(session.externalAccount),
        ensureLeading0x(implementationAddress),
        impl.methods.initialize(
          ensureLeading0x(session.externalAccount)
        ).encodeABI()
      ).txo
    )
    const resp = throwIfError(await this.relayerProxyService.submitTransaction({
      transaction: txn
    }))

    this.logger.event(EventType.DeployWalletTxSent, {
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
}
