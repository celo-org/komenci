import { WalletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { DisbursementSummary, FundingService } from '@komenci/blockchain/dist/funding.service'
import { networkConfig, NetworkConfig, RelayerAccounts } from '@komenci/core'
import { Inject } from '@nestjs/common'
import BigNumber from 'bignumber.js'
import commander from 'commander'
import { Command, Console, createSpinner } from 'nestjs-console'
import { Logger } from 'nestjs-pino'
import { TransactionReceipt } from 'web3-core'
import { fundConfig } from './fund.config'

@Console({
  name: 'fund',
  description: 'Manage the fund and relayers',
})
export class FundCommand {
  constructor(
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    @Inject(fundConfig.KEY)
    private readonly fundCfg: WalletConfig,
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
    const fund = this.fundCfg.address
    spin.start(`Disbursing funds`)

    let relayers: RelayerAccounts[] = []
    if (opts.relayer.length > 0) {
      opts.relayer.forEach(r => {
        const relayer = this.networkCfg.relayers.find(pr => pr.externalAccount === r)
        if (relayer) {
          relayers.push(relayer)
        } else {
          spin.warn(`Skipping ${r}: relayer not found in config`)
        }
      })
    } else {
      relayers = this.networkCfg.relayers
    }


    if (relayers.length === 0) {
      spin.fail("No relayers to fund")
      process.exit(1)
    }

    spin.info(`Funding relayers: `)
    relayers.forEach(r => {
      spin.info(`   - ${r.externalAccount}`)
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

    const receipts: Promise<TransactionReceipt>[] = []

    const results = await Promise.all(Object.keys(summary).map(async (relayer) => {
      const celoTxHash = await summary[relayer].celo.getHash()
      spin.info(`-celo-> Relayer#${relayer}`)
      spin.info(`        ${celoTxHash}`)

      const cUSDTxHash = await summary[relayer].cUSD.getHash()
      spin.info(`-cUSD-> Relayer#${relayer}`)
      spin.info(`        ${cUSDTxHash}`)

      return Promise.all([
        summary[relayer].celo.waitReceipt(),
        summary[relayer].cUSD.waitReceipt()
      ])
    }))

    let failedTxs = 0
    results.forEach((relayerReceipts) => {
      relayerReceipts.forEach((receipt) => {
        if (receipt.status === true) {
          spin.succeed(`Tx:${receipt.transactionHash} [OK]`)
        } else {
          spin.warn(`Tx:${receipt.transactionHash} [REVERT]`)
          failedTxs += 1
        }
      })
    })

    if (failedTxs > 0) {
      spin.fail(`${failedTxs}/${results.length * 2} failed txs. Check summary`)
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
    const wallet = this.fundCfg.address
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
    this.logger.log(this.networkCfg.relayers)
    const spin = createSpinner()
    spin.start('Collecting relayer balances')

    const balanceSummary = await this.fundingSvc.getRelayerBalances(this.networkCfg.relayers)

    spin.start('Done loading balances')
    const exp = new BigNumber(10).pow(18)

    const resp = this.networkCfg.relayers.reduce<any>(
      (acc, r, idx) => {
        acc[r.externalAccount] = {
          "celo": balanceSummary[r.externalAccount].celo.div(exp).toFixed(),
          [r.metaTransactionWallet]: {
            "cUSD": balanceSummary[r.externalAccount].cUSD.div(exp).toFixed()
          }
        }
        return acc
      },
      {}
    )

    this.logger.log(resp)
  }
}
