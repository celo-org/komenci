import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { EventType, KomenciLoggerService } from '@app/komenci-logger'
import { ContractKit } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { appConfig, AppConfig } from 'apps/relayer/src/config/app.config'
import BigNumber from 'bignumber.js'

@Injectable()
export class BalanceService implements OnModuleInit {
  private cUSD: StableTokenWrapper
  private celo: GoldTokenWrapper
  private timer: NodeJS.Timeout

  constructor(
    private readonly kit: ContractKit,
    private readonly logger: KomenciLoggerService,
    @Inject(walletConfig.KEY) private walletCfg: WalletConfig,
    private readonly metaTxWallet: MetaTransactionWalletWrapper
  ) {}

  async onModuleInit() {
    this.cUSD = await this.kit.contracts.getStableToken()
    this.celo = await this.kit.contracts.getGoldToken()
    await this.logBalance()
  }

  /**
   * Log Relayer balance:
   * - cUSD held by the relayer meta tx wallet
   * - celo held by the relayer EOA
   */
  public async logBalance() {
    const cUSDBalance = await this.cUSD.balanceOf(this.metaTxWallet.address)
    const celoBalance = await this.celo.balanceOf(this.walletCfg.address)
    const exp = new BigNumber(10).pow(18)

    this.logger.event(EventType.RelayerBalance, {
      cUSD: cUSDBalance.div(exp).toFixed(),
      celo: celoBalance.div(exp).toFixed(),
    })
  }
}
