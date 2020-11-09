import { WalletConfig } from '@app/blockchain/config/wallet.config'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { normalizeAddress, NULL_ADDRESS } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { newMetaTransactionWallet } from '@celo/contractkit/lib/generated/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { isValidAddress } from '@celo/utils/lib/address'
import { Inject } from '@nestjs/common'
import { fundConfig } from 'apps/tools/src/fund.config'
import commander from 'commander'
import { Command, Console, createSpinner } from 'nestjs-console'
import { Logger } from 'nestjs-pino'

@Console({
  name: 'deployer',
  description: 'Manage permissions and meta-tx wallets',
})
export class DeployerCommand {
  constructor(
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    @Inject(fundConfig.KEY)
    private readonly fundCfg: WalletConfig,
    private readonly deployer: MetaTransactionWalletDeployerWrapper,
    private readonly contractKit: ContractKit,
    private readonly logger: Logger
  ) {}

  @Command({
    command: 'ensureHasMetaTxWallet',
    description: 'Ensure that all relayers have a meta-tx wallet deployed',
    options: [
      {
        flags: '-i, --implementation <address>',
        required: false,
        defaultValue: null,
        description: 'The implementation address to use'
      },
    ]
  })
  async ensureHasMetaTxWallet(cmd: commander.Command): Promise<void> {
    const opts = cmd.opts()
    const availableImplementations = Object.keys(
      this.networkCfg.contracts.MetaTransactionWalletVersions
    )
    let implementationAddress: string
    if (opts.implementation == null) {
      implementationAddress = availableImplementations[availableImplementations.length - 1]
    } else {
      implementationAddress = availableImplementations.find(
        (impl) => {
          return normalizeAddress(impl) === normalizeAddress(opts.implementation)
        }
      )
      if (implementationAddress === undefined) {
        throw(new Error("Invalid implementation address"))
      }
    }

    const account = this.contractKit.getWallet().getAccounts()[0]
    console.log('Deploying from: ', account)
    const metaTxWallet = newMetaTransactionWallet(this.contractKit.web3, implementationAddress)
    const spin = createSpinner()
    spin.start("Ensuring all relayers have wallets")

    await Promise.all(
      this.networkCfg.relayers.map(async (relayer) => {
        const relayerEOA = relayer.externalAccount
        const wallet = relayer.metaTransactionWallet
        if (isValidAddress(wallet)) {
          spin.info(`Relayer:${relayerEOA} has wallet: ${wallet} ✅`)
        } else {
          spin.info(`Relayer:${relayerEOA} needs wallet. Deploying.`)
          const receipt = await this.deployer.deploy(
            relayerEOA,
            implementationAddress,
            metaTxWallet.methods.initialize(relayerEOA).encodeABI()
          // @ts-ignore
          ).sendAndWaitForReceipt({
            from: this.fundCfg.address
          })

          if (receipt.status === true) {
            spin.info(`Relayer:${relayerEOA} wallet deployed! tx:${receipt.transactionHash}`)
          } else {
            spin.fail(`Relayer:${relayerEOA} could not deploy wallet - tx:${receipt.transactionHash}`)
          }
        }
      })
    )
    spin.succeed()
  }
}
