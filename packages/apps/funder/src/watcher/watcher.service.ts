import {ContractKit} from '@celo/contractkit'
import {WalletConfig} from "@komenci/blockchain/dist/config/wallet.config"
import {Balance, FundingService, RelayerWithBalance} from "@komenci/blockchain/dist/funding.service"
import {fundConfig} from "@komenci/cli/dist/fund.config"
import {NetworkConfig, networkConfig, RelayerAccounts} from '@komenci/core/dist/network.config'
import {EventType, KomenciLoggerService} from "@komenci/logger"
import {Inject, Injectable} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import BigNumber from "bignumber.js"
import {Contract} from 'web3-eth-contract'
import {AppConfig, appConfig} from "../config/app.config"


const EXP = new BigNumber(10).pow(18)

@Injectable()
export class WatcherService {
  private readonly relayers: RelayerAccounts[]
  private readonly balanceThreshold: BigNumber
  private readonly topupAmount: BigNumber
  private readonly token: Contract

  constructor(
    private readonly logger: KomenciLoggerService,
    @Inject(networkConfig.KEY) private networkCfg: NetworkConfig,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    @Inject(fundConfig.KEY) private readonly fundCfg: WalletConfig,
    private fundingService: FundingService,
    private kit: ContractKit
  ) {
    this.balanceThreshold = new BigNumber(this.appCfg.balanceThreshold).times(EXP)
    this.topupAmount = new BigNumber(this.appCfg.topupAmount).times(EXP)
    this.token = new kit.connection.web3.eth.Contract(require('erc-20-abi'), this.appCfg.token, {
      from: this.fundCfg.address
    })
  }

  private async getAddressesUnderBalance() {
    const addressesWithBalance = await Promise.all(
      this.appCfg.addressesToWatch.map(async (addr) => {
        return {
          address: addr,
          balance: await this.balanceOf(addr)
        }
      })
    )

    return addressesWithBalance.filter(({balance}) => {
      return balance.lt(this.balanceThreshold)
    }).map(({address}) => address)
  }

  private async balanceOf(addr: string): Promise<BigNumber> {
    return new BigNumber(await this.token.methods.balanceOf(addr).call())
  }


  @Cron('* * * * * *')
  async tick() {
    const addresses = await this.getAddressesUnderBalance()
    if (addresses.length === 0) {
      return
    }
    const balance = await this.balanceOf(this.fundCfg.address) 
    const balanceNeeded = this.topupAmount.times(addresses.length)
    if (balanceNeeded.gt(balance)) {
      this.logger.event(EventType.InsufficientFunds, {
        token: await this.token.methods.symbol().call(),
        tokenAddress: this.token.options.address,
        balance: balance.div(EXP).toNumber(),
        balanceNeeded: balanceNeeded.div(EXP).toNumber()
      })
      return
    }

    this.logger.event(EventType.FundBalance, {
        token: await this.token.methods.symbol().call(),
        tokenAddress: this.token.options.address,
        balance: balance.div(EXP).toNumber(),
    })

    await Promise.all(addresses.map(async (addr) => {
      const result = await this.token.methods.transfer(
        addr,
        this.topupAmount
      ).send()
      this.logger.event(EventType.Topup, {
        destination: addr,
        token: await this.token.methods.symbol().call(),
        tokenAddress: this.token.options.address,
        amount: this.appCfg.topupAmount,
        txHash: result.transactionHash,
      })
    }))
  }
}
