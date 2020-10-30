import { walletConfig, WalletConfig } from '@app/blockchain/config/wallet.config'
import { DisbursementSummary, FundingService } from '@app/blockchain/funding.service'
import { Inject } from '@nestjs/common'
import { FundingConfig, fundingConfig } from 'apps/tools/src/config/funding.config'
import BigNumber from 'bignumber.js'
import commander from 'commander'
import { Command, Console, createSpinner } from 'nestjs-console'
import { Logger } from 'nestjs-pino'
import { TransactionReceipt } from 'web3-core'

@Console({
  name: 'fund',
  description: 'Manage the fund and relayers',
})
export class FundCommand {
  constructor(
    @Inject(fundingConfig.KEY)
    private readonly cfg: FundingConfig,
    @Inject(walletConfig.KEY)
    private readonly walletCfg: WalletConfig,
    private readonly fundingSvc: FundingService,
    private readonly logger: Logger
  ) {}

  @Command({
    command: 'disburse',
    description: 'Disburse funds to the relayers and their meta-tx wallets',
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
        flags: '-r, --relayer <relayer>',
        required: false,
        defaultValue: [],
        fn: (r, list) => list.concat([r]),
        description: 'Which relayer to fund (repetable), if non provided will fund all'
      }
    ]
  })
  async disburse(cmd: commander.Command): Promise<void> {
    const opts = cmd.opts()
    const spin = createSpinner()
    const fund = this.walletCfg.address
    spin.start(`Disbursing funds`)
    const relayers = opts.relayer.length === 0
      ? this.cfg.relayers
      : opts.relayers.filter(r => this.cfg.relayers.indexOf(r) > -1)

    if (relayers.length === 0) {
      if (this.cfg.relayers.length === 0) {
        spin.fail("Relayer config is empty")
        process.exit(1)
      } else if (opts.relayers.length > 0) {
        spin.fail("Couldn't find selected relayers in config")
        process.exit(1)
      }
    }


    spin.info(`Funding relayers: `)
    relayers.forEach(r => {
      spin.info(`   - ${r}`)
    })

    let summary: DisbursementSummary

    try {
      summary = await this.fundingSvc.disburseFunds(
        fund,
        relayers,
        opts.cusdAmount,
        opts.celoAmount,
      )
    } catch (e) {
      spin.fail(e.message)
      process.exit(1)
    }

    spin.succeed('Funding transactions submitted')
    spin.start(`Funding relayers`)

    const receipts: Array<Promise<TransactionReceipt>> = []

    await Promise.all(Object.keys(summary).map(async (relayer) => {
      const celoTxHash = await summary[relayer].celo.getHash()
      spin.info(`-celo-> Relayer#${relayer}`)
      spin.info(`        ${celoTxHash}`)

      const cUSDTxHash = await summary[relayer].cUSD.getHash()
      spin.info(`-cUSD-> Relayer#${relayer}`)
      spin.info(`        ${cUSDTxHash}`)

      receipts.push(
        summary[relayer].celo.waitReceipt(),
        summary[relayer].cUSD.waitReceipt()
      )
    }))

    const receiptResults = await Promise.all(receipts)
    let failedTxs = 0
    receiptResults.forEach((receipt) => {
      if (receipt.status === true) {
        spin.succeed(`Tx:${receipt.transactionHash} [OK]`)
      } else {
        spin.warn(`Tx:${receipt.transactionHash} [REVERT]`)
        failedTxs += 1
      }
    })

    if (failedTxs > 0) {
      spin.fail(`${failedTxs}/${receiptResults.length} failed txs. Check summary`)
    } else {
      spin.succeed('All transfers completed successfully!')
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
    const balances = await this.fundingSvc.getFundBalance(wallet)

    spin.succeed('Done loading balances')
    const exp = new BigNumber(10).pow(18)

    this.logger.log({
      [wallet]: {
        "celo": balances.celo.div(exp).toFixed(),
        "cUSD": balances.cUSD.div(exp).toFixed()
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
    spin.start('Collecting relayer balances')

    const balanceSummary = await this.fundingSvc.getRelayerBalances(this.cfg.relayers)

    spin.start('Done loading balances')
    const exp = new BigNumber(10).pow(18)

    const resp = this.cfg.relayers.reduce<any>(
      (acc, r, idx) => {
        acc[r] = {
          "celo": balanceSummary[r].celoBalance.div(exp).toFixed(),
          [balanceSummary[r].metaTxWalletAddress]: {
            "cUSD": balanceSummary[r].metaTxWalletCUSDBalance.div(exp).toFixed()
          }
        }
        return acc
      },
      {}
    )

    this.logger.log(resp)
  }
}
