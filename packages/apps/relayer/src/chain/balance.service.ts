import { ContractKit } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import BigNumber from 'bignumber.js'

@Injectable()
export class BalanceService implements OnModuleInit {
  private cUSD: StableTokenWrapper
  private celo: GoldTokenWrapper
  private timer: NodeJS.Timeout

  constructor(
    @Inject(ContractKit)
    private readonly kit: ContractKit,
    @Inject(KomenciLoggerService)
    private readonly logger: KomenciLoggerService,
    @Inject(walletConfig.KEY) 
    private walletCfg: WalletConfig,
    @Inject(MetaTransactionWalletWrapper)
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
      cUSD: parseFloat(cUSDBalance.div(exp).toFixed()),
      celo: parseFloat(celoBalance.div(exp).toFixed()),
    })
  }
}
