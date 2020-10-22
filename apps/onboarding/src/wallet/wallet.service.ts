import { AppConfig, appConfig } from '@app/onboarding/config/app.config'
import { RelayerProxyService } from '@app/onboarding/relayer_proxy.service'
import { Session } from '@app/onboarding/session/session.entity'
import { SessionService } from '@app/onboarding/session/session.service'
import { Err, Ok, Result, RootError } from '@celo/base/lib/result'
import { newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { toRawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Inject, Injectable } from '@nestjs/common'
import Web3 from 'web3'

export enum WalletErrorType {
  NotDeployed = "NotDeployed"
}

export class WalletNotDeployed extends RootError<WalletErrorType.NotDeployed> {
  constructor() {
    super(WalletErrorType.NotDeployed)
  }
}

type WalletError = WalletNotDeployed

@Injectable()
export class WalletService {
  constructor(
    private readonly relayerProxyService: RelayerProxyService,
    private readonly sessionService: SessionService,
    private readonly walletDeployer: MetaTransactionWalletDeployerWrapper,
    private readonly web3: Web3,
    @Inject(appConfig.KEY)
    private readonly cfg: AppConfig
  ) {}

  async getWallet(session: Session): Promise<Result<string, WalletError>> {
    const address = await this.walletDeployer.getWallet(session.externalAccount)
    if (address !== "0x0000000000000000000000000000000000000000") {
      return Ok(address)
    } else {
      return Err(new WalletNotDeployed())
    }
  }

  async deployWallet(session: Session): Promise<Result<string, WalletError>> {
    if (session.meta && session.meta.walletDeployTxHash !== undefined) {
      const deployDeadline = new Date(
        session.meta.walletDeployStartedAt +
        this.cfg.transactionTimeoutMs
      )

      if (new Date() < deployDeadline) {
        return Ok(session.meta.walletDeployTxHash)
      }
    }

    const impl = newMetaTransactionWallet(this.web3, this.cfg.mtwImplementationAddress)
    const resp = await this.relayerProxyService.submitTransaction({
      transaction: toRawTransaction(
        this.walletDeployer.deploy(
          session.externalAccount,
          this.cfg.mtwImplementationAddress,
          impl.methods.initialize(session.externalAccount).encodeABI()
        ).txo
      )
    })

    const result = await this.sessionService.update(session.id, {
      meta: {
        ...session.meta,
        walletDeployStartedAt: Date.now(),
        walletDeployTxHash: resp.payload
      }
    })

    console.log(resp.payload)

    return Ok(resp.payload)
  }
}
