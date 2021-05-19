import {ContractKit} from '@celo/contractkit'
import {WalletConfig} from "@komenci/blockchain/dist/config/wallet.config"
import {fundConfig} from "@komenci/cli/dist/fund.config"
import {EventType, KomenciLoggerService} from "@komenci/logger"
import {Inject, Injectable, OnModuleInit} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import BigNumber from "bignumber.js"
import {Contract} from 'web3-eth-contract'
import {AppConfig, appConfig} from "../config/app.config"


@Injectable()
export class WatcherService implements OnModuleInit {
  private readonly token: Contract
  private balanceThreshold: BigNumber
  private topupAmount: BigNumber
  private exp: BigNumber

  constructor(
    private readonly logger: KomenciLoggerService,
    @Inject(appConfig.KEY) private appCfg: AppConfig,
    @Inject(fundConfig.KEY) private readonly fundCfg: WalletConfig,
    private kit: ContractKit
  ) {
    this.token = new this.kit.connection.web3.eth.Contract(require('erc-20-abi'), this.appCfg.token, {
      from: this.fundCfg.address
    })
  }

  async onModuleInit() {
    this.exp = new BigNumber(10).pow(await this.token.methods.decimals().call())
    this.balanceThreshold = new BigNumber(this.appCfg.balanceThreshold).times(this.exp)
    this.topupAmount = new BigNumber(this.appCfg.topupAmount).times(this.exp)
  }

  @Cron('0 * * * * *')
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
        balance: balance.div(this.exp).toNumber(),
        balanceNeeded: balanceNeeded.div(this.exp).toNumber()
      })
      return
    }

    this.logger.event(EventType.FundBalance, {
        token: await this.token.methods.symbol().call(),
        tokenAddress: this.token.options.address,
        balance: balance.div(this.exp).toNumber(),
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
}
