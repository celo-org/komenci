import { ContractKit } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import BigNumber from 'bignumber.js'
import {appConfig, AppConfig} from "../config/app.config"

@Injectable()
export class BalanceService implements OnModuleInit {
  private cUSD: StableTokenWrapper
  private celo: GoldTokenWrapper
  private timer: NodeJS.Timeout
  private currentCeloBalance: BigNumber
  private currentCUSDBalance: BigNumber

  constructor(
    private readonly kit: ContractKit,
    private readonly logger: KomenciLoggerService,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
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
    this.currentCeloBalance = await this.cUSD.balanceOf(this.metaTxWallet.address)
    this.currentCUSDBalance = await this.celo.balanceOf(this.walletCfg.address)
    const exp = new BigNumber(10).pow(18)

    this.logger.event(EventType.RelayerBalance, {
      cUSD: parseFloat(this.currentCeloBalance.div(exp).toFixed()),
      celo: parseFloat(this.currentCUSDBalance.div(exp).toFixed()),
    })
  }

  public async hasMinimumBalance() {
    return (this.currentCeloBalance.isGreaterThanOrEqualTo(this.appCfg.minCeloBalance)) &&
      (this.currentCUSDBalance.isGreaterThanOrEqualTo(this.appCfg.minCUSDBalance))
  }
}
