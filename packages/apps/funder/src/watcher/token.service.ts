import {ContractKit} from '@celo/contractkit'
import {WalletConfig} from "@komenci/blockchain/dist/config/wallet.config"
import {fundConfig} from "@komenci/cli/dist/fund.config"
import {EventType, KomenciLoggerService} from "@komenci/logger"
import {Inject, Injectable, OnModuleInit} from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import BigNumber from "bignumber.js"
import {Contract} from 'web3-eth-contract'
import {AppConfig, appConfig, TokenConfig} from "../config/app.config"


@Injectable()
export class TokenService  {
  private token: Contract
  private balanceThreshold: BigNumber
  private topupAmount: BigNumber
  private exp: BigNumber
  private config: TokenConfig

  constructor(
    private readonly logger: KomenciLoggerService,
    @Inject(fundConfig.KEY) private readonly fundCfg: WalletConfig,
    private kit: ContractKit
  ) {}

  async init(config: TokenConfig) {
    this.config = config
    this.token = new this.kit.connection.web3.eth.Contract(require('erc-20-abi'), this.config.token, {
      from: this.fundCfg.address
    })
    this.exp = new BigNumber(10).pow(await this.token.methods.decimals().call())
    this.balanceThreshold = new BigNumber(this.config.balanceThreshold).times(this.exp)
    this.topupAmount = new BigNumber(this.config.topupAmount).times(this.exp)
  }

  async tick() {
    const addresses = await this.getAddressesUnderThreshold()
    if (addresses.length === 0) {
      this.logger.debug({
          token: await this.token.methods.symbol().call(),
          tokenAddress: this.token.options.address,
      }, "No addresses to fund")
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
        amount: this.config.topupAmount,
        txHash: result.transactionHash,
      })
    }))
  }

  private async getAddressesUnderThreshold() {
    const addressIsUnderThreshold = await Promise.all(
      this.config.addressesToWatch.map(async (addr) => {
        return (await this.balanceOf(addr)).lt(this.balanceThreshold)
      })
    )

    return this.config.addressesToWatch.filter((_, index) => addressIsUnderThreshold[index])
  }

  private async balanceOf(addr: string): Promise<BigNumber> {
    return new BigNumber(await this.token.methods.balanceOf(addr).call())
  }
}
