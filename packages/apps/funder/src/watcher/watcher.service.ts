import {Inject, Injectable} from '@nestjs/common';
import {EventType, KomenciLoggerService} from "@komenci/logger";
import {WalletConfig} from "@komenci/blockchain/dist/config/wallet.config";
import {AppConfig, appConfig} from "../config/app.config";
import {NetworkConfig, networkConfig, RelayerAccounts} from '@komenci/core/dist/network.config'
import BigNumber from "bignumber.js";
import {Balance, FundingService, RelayerWithBalance} from "@komenci/blockchain/dist/funding.service";
import {ContractKit} from "@celo/contractkit";
import {fundConfig} from "@komenci/cli/dist/fund.config";

@Injectable()
export class WatcherService {
  private readonly relayerAddresses: RelayerAccounts[]
  private readonly celoThreshold: BigNumber
  private readonly cUSDThreshold: BigNumber
  private readonly celoTopUpAmount: BigNumber
  private readonly cUSDTopUpAmount: BigNumber
  private readonly exp: BigNumber

  private txTimer: NodeJS.Timeout

  constructor(
    private readonly logger: KomenciLoggerService,
    @Inject(networkConfig.KEY) private networkCfg: NetworkConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    @Inject(fundConfig.KEY) private readonly fundCfg: WalletConfig,
    private fundingService: FundingService,
  ) {
    this.exp = new BigNumber(10).pow(18)

    this.relayerAddresses = this.networkCfg.relayers
    this.celoThreshold = new BigNumber(this.appCfg.celoThreshold).times(this.exp)
    this.cUSDThreshold = new BigNumber(this.appCfg.cUSDThreshold).times(this.exp)
    this.celoTopUpAmount = new BigNumber(this.appCfg.celoTopUpAmount).times(this.exp)
    this.cUSDTopUpAmount = new BigNumber(this.appCfg.cUSDTopUpAmount).times(this.exp)
  }

  async onModuleInit() {
    this.txTimer = setInterval(
      () => this.fundRelayers(),
      this.appCfg.fundingInterval
    )
  }

  async getRelayersToSendCelo(balances: RelayerWithBalance[]) {
    return balances.filter(balance => balance.celo.isLessThan(this.celoThreshold))
  }
  async getRelayersToSendCUSD(balances: RelayerWithBalance[]) {
    return balances.filter(balance => balance.cUSD.isLessThan(this.cUSDThreshold))
  }

  async fundWithCelo(fundBalance: Balance, relayersToSendCelo: RelayerWithBalance[]) {
    if (relayersToSendCelo.length === 0) return []
    if (!this.fundingService.fundHasEnoughCelo(fundBalance, this.celoTopUpAmount, relayersToSendCelo.length)) {
      this.logger.event(EventType.InsufficientCelo, {
        fundCelo: parseFloat(fundBalance.celo.div(this.exp).toFixed()),
        requiredCelo: parseFloat(this.celoTopUpAmount.div(this.exp).times(relayersToSendCelo.length).toFixed())
      })
      return []
    }

    this.logger.event(EventType.CeloTopUp, {
      celoPerRelayer: parseFloat(this.celoTopUpAmount.div(this.exp).toFixed()),
      totalCelo: parseFloat(this.celoTopUpAmount.div(this.exp).times(relayersToSendCelo.length).toFixed()),
      relayerAddresses: relayersToSendCelo.map(relayer => relayer.externalAccount)
    })

    return this.fundingService.fundRelayersWithCelo(this.fundCfg.address, relayersToSendCelo, this.celoTopUpAmount)
  }

  async fundWithCUSD(fundBalance: Balance, relayersToSendCUSD: RelayerWithBalance[]) {
    if (relayersToSendCUSD.length === 0) return []
    if (!this.fundingService.fundHasEnoughCUSD(fundBalance, this.cUSDTopUpAmount, relayersToSendCUSD.length)) {
      this.logger.event(EventType.InsufficientCUSD, {
        fundCUSD: parseFloat(fundBalance.cUSD.div(this.exp).toFixed()),
        requiredCUSD: parseFloat(this.cUSDTopUpAmount.div(this.exp).times(relayersToSendCUSD.length).toFixed())
      })
      return []
    }

    this.logger.event(EventType.CUSDTopUp, {
      cUSDPerRelayer: parseFloat(this.cUSDTopUpAmount.div(this.exp).toFixed()),
      totalCUSD: parseFloat(this.cUSDTopUpAmount.div(this.exp).times(relayersToSendCUSD.length).toFixed()),
      relayerAddresses: relayersToSendCUSD.map(relayer => relayer.externalAccount)
    })

    return this.fundingService.fundRelayersWithCUSD(this.fundCfg.address, relayersToSendCUSD, this.cUSDTopUpAmount)
  }

  async fundRelayers() {
    const balances = await this.fundingService.getRelayerBalanceList(this.relayerAddresses)
    const relayersToSendCUSD = await this.getRelayersToSendCUSD(balances)
    const relayersToSendCelo = await this.getRelayersToSendCelo(balances)
    if (relayersToSendCelo.length === 0 && relayersToSendCUSD.length === 0) {
      this.logger.event(EventType.NoRelayersToFund, {})
      return;
    }

    const fundBalance = await this.fundingService.getFundBalance(this.fundCfg.address)
    this.logger.event(EventType.FundBalance, {
      cUSD: parseFloat(fundBalance.cUSD.div(this.exp).toFixed()),
      celo: parseFloat(fundBalance.celo.div(this.exp).toFixed()),
    })

    await Promise.all([
      this.fundWithCelo(fundBalance, relayersToSendCelo),
      this.fundWithCUSD(fundBalance, relayersToSendCUSD)
    ])
  }
}
