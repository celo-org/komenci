import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { Inject, Injectable } from '@nestjs/common'
import { FundingConfig, fundingConfig } from 'apps/tools/src/config/funding.config'
import BigNumber from 'bignumber.js'
import commander from 'commander'
import { Command, Console, createSpinner } from 'nestjs-console'
import { Logger } from 'nestjs-pino'

@Console({
  name: 'fund',
  description: 'Manage the fund and relayers',
})
export class FundsService {
  constructor(
    private readonly deployer: MetaTransactionWalletDeployerWrapper,
    private readonly contractKit: ContractKit,
    @Inject(fundingConfig.KEY)
    private readonly cfg: FundingConfig,
    @Inject(walletConfig.KEY)
    private readonly walletCfg: WalletConfig,
    private readonly logger: Logger
  ) {}

  @Command({
    command: 'distributeFunds',
    description: 'Distribute funds to the relayers and their meta-tx wallets',
    options: [
      {
        flags: '-co, --celo-amount <celoValue>',
        required: false,
        defaultValue: 1,
        fn: (v) => parseFloat(v),
        description: 'The amount of Celo to transfer to each relayer'
      },
      {
        flags: '-cu, --cusd-amount <cUSDValue>',
        required: false,
        defaultValue: 2,
        fn: (v) => parseFloat(v),
        description: 'The amount of cUSD to transfer to each relayer meta-tx wallet'
      },
      {
        flags: '-r, --relayers <relayers>',
        required: false,
        defaultValue: 'all',
        fn: (v) => parseInt(v, 10),
        description: 'Which relayers to fund as comma separate index list'
      }
    ]
  })
  async distributeFunds(cmd: commander.Command): Promise<void> {
    const opts = cmd.opts()
    const spin = createSpinner()
    const wallet = this.walletCfg.address
    this.logger.log({fund: wallet})
    spin.start('Getting fund balances')

    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const [celoBalance, cUSDBalance] = await Promise.all([
      celo.balanceOf(wallet),
      cUSD.balanceOf(wallet),
    ])

    spin.succeed('Loaded fund balance')

    const exp = new BigNumber(10).pow(18)
    const celoAmount = new BigNumber(opts.celoAmount).times(exp)
    const celoNeeded = celoAmount.times(this.cfg.relayers.length)
    const cUSDAmount = new BigNumber(opts.cusdAmount).times(exp)
    const cUSDNeeded = cUSDAmount.times(this.cfg.relayers.length)

    if (celoBalance.isLessThan(celoNeeded)) {
      this.logger.error("Not enough celo balance in fund" )
      process.exit(1)
    }

    if (cUSDBalance.isLessThan(cUSDNeeded)) {
      this.logger.error("Not enough cUSD balance in fund")
      process.exit(1)
    }

    spin.start("Fetch relayer wallets")
    const wallets = await Promise.all(
      this.cfg.relayers.map(async (r) => {
        return this.deployer.getWallet(r)
      })
    )
    spin.succeed('Wallets fetched')
    spin.start(`Funding relayers`)

    const receipts = await Promise.all(
      this.cfg.relayers.map(async (relayer, idx) => {
        // @ts-ignore
        const cUSDTx = await cUSD.transfer(wallets[idx], cUSDAmount.toFixed()).send({
          from: this.walletCfg.address
        })
        const cUSDTxHash = await cUSDTx.getHash()
        spin.info(`FUND -cUSD-> Relayer#${idx} :: ${cUSDTxHash}`)

        // @ts-ignore
        const celoTx = await celo.transfer(relayer, celoAmount.toFixed()).send({
          from: this.walletCfg.address
        })
        const celoTxHash = await celoTx.getHash()
        spin.info(`FUND -celo-> Relayer#${idx} :: ${celoTxHash}`)

        return Promise.all([
          cUSDTx.waitReceipt(),
          celoTx.waitReceipt(),
        ])
      })
    )

    const errors = receipts.reduce<Array<{relayer: string, transfer: string}>>(
      (errs, rcpts, idx) => {
        const [cUSDReceipt, celoReceipt] = rcpts
        if (cUSDReceipt.status === false) {
          errs.push({
            relayer: this.cfg.relayers[idx],
            transfer: 'cUSD',
          })
        }

        if (celoReceipt.status === false) {
          errs.push({
            relayer: this.cfg.relayers[idx],
            transfer: 'celo',
          })
        }
        return errs
      },
      []
    )

    if (errors.length === 0) {
      spin.succeed('All transfers done!')
    } else {
      spin.warn(`Transfers finished with ${errors.length} errors :(`)
      this.logger.error(errors)
    }
  }

  @Command({
    command: 'getFundBalance',
    description: 'Check fund balance',
  })
  async getFundBalance(cmd: commander.Command): Promise<void> {
    const spin = createSpinner()
    const wallet = this.walletCfg.address
    this.logger.log({fund: wallet})
    spin.start('Getting fund balances')

    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const balances = await Promise.all([
      celo.balanceOf(wallet),
      cUSD.balanceOf(wallet),
    ])

    spin.succeed('Done loading balances')
    const exp = new BigNumber(10).pow(18)

    this.logger.log({
      [wallet]: {
        "celo": balances[0].div(exp).toFixed(),
        "cUSD": balances[0].div(exp).toFixed()
      }
    })
  }

  @Command({
    command: 'getRelayerBalance',
    description: 'Check relayer balances',
  })
  async getBalance(cmd: commander.Command): Promise<void> {
    const flags = cmd.opts()
    this.logger.log(this.cfg)
    const spin = createSpinner()
    spin.start('Getting relayer MetaTx wallets')

    const wallets = await Promise.all(
      this.cfg.relayers.map(async (r) => {
        return this.deployer.getWallet(r)
      })
    )

    spin.succeed('Done loading meta-tx wallets')
    spin.start('Querying for balances')

    const cUSD = await this.contractKit.contracts.getStableToken()
    const celo = await this.contractKit.contracts.getGoldToken()

    const balances = await Promise.all(
      this.cfg.relayers.map(async (r, idx) => {
        return Promise.all([
          celo.balanceOf(r),
          cUSD.balanceOf(wallets[idx]),
        ])
      })
    )

    spin.succeed('Done loading balances')
    const exp = new BigNumber(10).pow(18)

    const resp = this.cfg.relayers.reduce<any>(
      (acc, r, idx) => {
        const [celoBalance, cUSDBalance] = balances[idx]
        acc[r] = {
          "celo": celoBalance.div(exp).toFixed(),
          [wallets[idx]]: {
            "cUSD": cUSDBalance.div(exp).toFixed()
          }
        }
        return acc
      },
      {}
    )

    this.logger.log(resp)
  }
}
