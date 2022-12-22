import { WalletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { DisbursementSummary, FundingService } from '@komenci/blockchain/dist/funding.service'
import { networkConfig, NetworkConfig, RelayerAccounts } from '@komenci/core'
import { Inject } from '@nestjs/common'
import BigNumber from 'bignumber.js'
import {
  MetaTransactionWalletWrapper,
} from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { CeloContract, ContractKit } from '@celo/contractkit'
import commander from 'commander'
import { Command, Console, createSpinner } from 'nestjs-console'
import { Logger } from 'nestjs-pino'
import { TransactionReceipt } from 'web3-core'
import { fundConfig } from './fund.config'
import { ensureLeading0x } from '@celo/base'

@Console({
  name: 'withdraw',
  description: 'Withdraw funds from relayers',
})
export class WithdrawCommand {
  constructor(
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    @Inject(fundConfig.KEY)
    private readonly withdrawCfg: WalletConfig,
    private readonly fundingSvc: FundingService,
    private readonly logger: Logger
  ) {}

  @Command({
    command: 'withdraw',
    description: 'Disburse funds to the relayers and their meta-tx wallets',
    options: [
      {
        flags: '-co, --celo-amount <celoValue>',
        required: false,
        defaultValue: 0,
        fn: (v) => parseFloat(v),
        description: 'The amount of Celo to transfer to the withdraw address'
      },
      {
        flags: '-cu, --cusd-amount <cUSDValue>',
        required: false,
        defaultValue: 0,
        fn: (v) => parseFloat(v),
        description: 'The amount of cUSD to transfer to each relayer meta-tx wallet'
      },
      {
        flags: '-c, --contract <address>',
        required: true,
        defaultValue: [],
        fn: (a) => ensureLeading0x(a),
        description: 'Relayer contract address'
      },
      {
        flags: '--to <address>',
        required: true,
        defaultValue: '0xbeaaD97c5DbFb4Da432DC5CB5C9e566B6728e1Fc',
        fn: (a) => ensureLeading0x(a),
        description: 'Withdraw address'
      }
    ]
  })
  async withdraw(cmd: commander.Command): Promise<void> {
    const opts = cmd.opts()
    const spin = createSpinner()
    spin.start(`Withdrawing funds`)

    try {
      await this.fundingSvc.withdrawFunds(
        opts.contract,
        opts.to,
        opts.cusdAmount,
        opts.celoAmount,
      )
      // await this.fundingSvc.withdrawAll(
      //   opts.contract,
      //   opts.to,
      // )
    } catch (e) {
      spin.fail(e.message)
      process.exit(1)
    }
    spin.succeed('Funding transactions submitted')
  }
}
