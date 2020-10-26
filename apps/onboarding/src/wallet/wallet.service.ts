import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RelayerProxyService } from '@app/onboarding/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import { normalizeAddress } from '@celo/base'
import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { ContractKit } from '@celo/contractkit/lib/kit'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Inject, Injectable } from '@nestjs/common'
import Web3 from 'web3'

export enum WalletErrorType {
  NotDeployed = "NotDeployed",
  InvalidImplementation = "InvalidImplementation"
}

export class WalletNotDeployed extends RootError<WalletErrorType> {
  constructor() {
    super(WalletErrorType.NotDeployed)
  }
}

export class InvalidImplementation extends RootError<WalletErrorType> {
  constructor(public readonly implementationAddress) {
    super(WalletErrorType.InvalidImplementation)
  }
}

type WalletError = WalletNotDeployed | InvalidImplementation

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
}
