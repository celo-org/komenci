import {ContractKit} from "@celo/contractkit"
import {WalletConfig} from "@komenci/blockchain/dist/config/wallet.config"
import {Balance, FundingService, RelayerWithBalance} from "@komenci/blockchain/dist/funding.service"
import {fundConfig} from "@komenci/cli/dist/fund.config"
import {NetworkConfig, networkConfig, RelayerAccounts} from '@komenci/core/dist/network.config'
import {EventType, KomenciLoggerService} from "@komenci/logger"
import {Inject, Injectable} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import BigNumber from "bignumber.js"
import {AppConfig, appConfig} from "../config/app.config"


const EXP = new BigNumber(10).pow(18)

@Injectable()
export class WatcherService {
  private readonly relayers: RelayerAccounts[]
  private readonly exponent: BigNumber

  constructor(
    private readonly logger: KomenciLoggerService,
    @Inject(networkConfig.KEY) private networkCfg: NetworkConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    @Inject(fundConfig.KEY) private readonly fundCfg: WalletConfig,
    private fundingService: FundingService,
  ) {
    const relayersToWatchSet = new Set(appCfg.relayersToWatch)


    this.relayers = this.networkCfg.relayers.filter((r) => {
      return r.externalAccount in relayersToWatchSet
    })
  }

  async getRelayersToSendCelo(balances: RelayerWithBalance[]) {
    return balances.filter(balance => balance.celo.isLessThan(this.appCfg.topupThreshold.celo))
  }
  async getRelayersToSendCUSD(balances: RelayerWithBalance[]) {
    return balances.filter(balance => balance.cUSD.isLessThan(this.appCfg.topupThreshold.cUSD))
  }

  async fundWithCelo(fundBalance: Balance, relayersToSendCelo: RelayerWithBalance[]) {
    if (relayersToSendCelo.length === 0) { return [] }
    const topupAmountWei = new BigNumber(this.appCfg.topupMaxAmount.celo).times(EXP)

    if (!this.fundingService.fundHasEnoughCelo(
      fundBalance, 
      topupAmountWei,
      relayersToSendCelo.length
    )) {
      this.logger.event(EventType.InsufficientCelo, {
        fundCelo: parseFloat(fundBalance.celo.div(EXP).toFixed()),
        requiredCelo: this.appCfg.topupMaxAmount.celo * relayersToSendCelo.length
      })
      return []
    }

    this.logger.event(EventType.CeloTopUp, {
      celoPerRelayer: this.appCfg.topupMaxAmount.celo,
      totalCelo: this.appCfg.topupMaxAmount.celo * relayersToSendCelo.length,
      relayerAddresses: relayersToSendCelo.map(relayer => relayer.externalAccount)
    })

    return this.fundingService.fundRelayersWithCelo(
      this.fundCfg.address, 
      relayersToSendCelo, 
      topupAmountWei,
    )
  }

  async fundWithCUSD(fundBalance: Balance, relayersToSendCUSD: RelayerWithBalance[]) {
    if (relayersToSendCUSD.length === 0) { return [] }
    const topupAmountWei = new BigNumber(this.appCfg.topupMaxAmount.cUSD).times(EXP)

    if (!this.fundingService.fundHasEnoughCelo(
      fundBalance, 
      topupAmountWei,
      relayersToSendCUSD.length
    )) {
      this.logger.event(EventType.InsufficientCUSD, {
        fundCUSD: parseFloat(fundBalance.cUSD.div(EXP).toFixed()),
        requiredCUSD: this.appCfg.topupMaxAmount.celo * relayersToSendCUSD.length
      })
      return []
    }

    this.logger.event(EventType.CUSDTopUp, {
      cUSDPerRelayer: this.appCfg.topupMaxAmount.cUSD,
      totalCUSD: this.appCfg.topupMaxAmount.cUSD * relayersToSendCUSD.length,
      relayerAddresses: relayersToSendCUSD.map(relayer => relayer.externalAccount)
    })

    return this.fundingService.fundRelayersWithCUSD(
      this.fundCfg.address, 
      relayersToSendCUSD, 
      topupAmountWei,
    )
  }

  @Cron('0 0 * * * *')
  async watchRelayers() {
    const balances = await this.fundingService.getRelayerBalanceList(this.relayers)
    const relayersToSendCUSD = await this.getRelayersToSendCUSD(balances)
    const relayersToSendCelo = await this.getRelayersToSendCelo(balances)
    if (relayersToSendCelo.length === 0 && relayersToSendCUSD.length === 0) {
      this.logger.event(EventType.NoRelayersToFund, {})
      return
    }

    const fundBalance = await this.fundingService.getFundBalance(this.fundCfg.address)
    this.logger.event(EventType.FundBalance, {
      cUSD: parseFloat(fundBalance.cUSD.div(EXP).toFixed()),
      celo: parseFloat(fundBalance.celo.div(EXP).toFixed()),
    })

    await Promise.all([
      this.fundWithCelo(fundBalance, relayersToSendCelo),
      this.fundWithCUSD(fundBalance, relayersToSendCUSD)
    ])
  }
}
