import { Address, ensureLeading0x, throwIfError } from '@celo/base'
import { Err, Ok, Result } from '@celo/base/lib/result'
import { newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { ContractKit } from '@celo/contractkit/lib/kit'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
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
import { EIP1167ProxyDeployer } from './eip1167-proxy-deployer'
import { LegacyProxyDeployer } from './legacy-proxy-deployer'

export enum WalletProxyType {
  // This means we deploy: Celo Core Proxy -> MTW
  Legacy = "Legacy", 
  // This means we deploy: EIP1167Proxy -> Celo Core Proxy -> MTW
  EIP1167 = "EIP1167" 
}

export interface ProxyDeployer {
  findWallet(blockNumber: number, txHash: string, deployerAddress: string): Promise<Result<string, WalletNotDeployed>>
  getDeployTransaction(owner: string, implementation: string, initCallData: string): {transaction: RawTransaction, deployerAddress: string}
}

@Injectable({
  // RelayerProxyService is Request scoped
  scope: Scope.REQUEST
})
export class WalletService {
  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly sessionService: SessionService,
    private readonly legacyDeployer: MetaTransactionWalletDeployerWrapper,
    private readonly eip1167ProxyDeployer: EIP1167ProxyDeployer,
    private readonly legacyProxyDeployer: LegacyProxyDeployer,
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

  getProxyDeployer(proxyType?: WalletProxyType): ProxyDeployer {
    if (proxyType === WalletProxyType.EIP1167) {
      return this.eip1167ProxyDeployer
    }
    return this.legacyProxyDeployer
  }

  async getWallet(session: Session, implementationAddress?: string): Promise<Result<string, WalletNotDeployed>> {
    if (this.hasDeployInProgress(session, implementationAddress)) {
      const tx = await this.web3.eth.getTransaction(
        session.meta.walletDeploy.txHash
      )

      if (tx.blockNumber !== null) {
        const proxyDeployer = this.getProxyDeployer(session.meta.walletDeploy.proxyType)
        return proxyDeployer.findWallet(tx.blockNumber, tx.hash, session.meta.walletDeploy.deployerAddress)
      }
    }

    return Err(new WalletNotDeployed())
  }

  async deployWallet(
    session: Session, 
    implementationAddress: string,
    proxyType: WalletProxyType
  ): Promise<Result<{txHash: string, deployerAddress: string}, InvalidImplementation>> {
    if (!this.isValidImplementation(implementationAddress)) {
      return Err(new InvalidImplementation(implementationAddress))
    }

    if (this.hasDeployInProgress(session, implementationAddress)) {
      return Ok({
        txHash: session.meta.walletDeploy.txHash,
        deployerAddress: session.meta.walletDeploy.deployerAddress
      })
    }

    const impl = newMetaTransactionWallet(this.web3, implementationAddress)
    const initCallData = impl.methods.initialize(
      ensureLeading0x(session.externalAccount)
    ).encodeABI()

    const proxyDeployer = this.getProxyDeployer(proxyType)
    const { transaction, deployerAddress } = proxyDeployer.getDeployTransaction(
      session.externalAccount,
      implementationAddress,
      initCallData,
    )


    const resp = throwIfError(await this.relayerProxyService.submitTransaction({transaction}))
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
          implementationAddress,
          deployerAddress: deployerAddress
        }
      }
    })

    return Ok({
      txHash: resp.payload,
      deployerAddress: "0x0"
    })
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
