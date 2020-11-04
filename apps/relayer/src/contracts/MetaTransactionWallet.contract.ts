import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { normalizeAddress } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { isValidAddress } from '@celo/utils/lib/address'
import { Logger } from 'nestjs-pino'

export const metaTransactionWalletProvider = {
  provide: MetaTransactionWalletWrapper,
  useFactory: async (
    networkCfg: NetworkConfig,
    walletCfg: WalletConfig,
    deployer: MetaTransactionWalletDeployerWrapper,
    contractKit: ContractKit,
    logger: Logger
  ) => {
    const relayer = networkCfg.relayers.find(r => {
      return normalizeAddress(r.externalAccount) === normalizeAddress(walletCfg.address)
    })

    if (relayer === undefined) {
      logger.error(`${walletCfg.address} not registered as a relayer in config`)
      return
    }

    if (isValidAddress(relayer.metaTransactionWallet)) {
      logger.log({
        message: 'Initialized MetaTransactionWallet',
        address: relayer.metaTransactionWallet
      })
      return contractKit.contracts.getMetaTransactionWallet(
        relayer.metaTransactionWallet
      )
    } else {
      logger.error({
        message: `Relayer doesn't have a valid MetaTransactionWallet in config`,
        address: walletCfg.address,
        metaTransactionWallet: relayer.metaTransactionWallet
      })
    }
  },
  inject: [
    networkConfig.KEY,
    walletConfig.KEY,
    MetaTransactionWalletDeployerWrapper,
    ContractKit,
    Logger
  ]
}

