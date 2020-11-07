import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { EventType, KomenciLoggerService } from '@app/komenci-logger'
import { MetadataError } from '@app/komenci-logger/errors'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { normalizeAddress, RootError } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { isValidAddress } from '@celo/utils/lib/address'

enum RelayerMTWErrorTypes {
  NotRegister = "RelayerNotRegistered",
  NoMTW = "NoMTW"
}

class RelayerNotRegisteredError extends RootError<RelayerMTWErrorTypes.NotRegister> {
  constructor() {
    super(RelayerMTWErrorTypes.NotRegister)
    this.message = `Relayer not registered as a relayer in config`
  }
}

class NoMTWError extends MetadataError<RelayerMTWErrorTypes.NoMTW> {
  constructor(meta: {configAddress: string}) {
    super(RelayerMTWErrorTypes.NoMTW, meta)
    this.message = `Relayer doesn't have a valid associated MTW in config`
  }
}

export const metaTransactionWalletProvider = {
  provide: MetaTransactionWalletWrapper,
  useFactory: async (
    networkCfg: NetworkConfig,
    walletCfg: WalletConfig,
    deployer: MetaTransactionWalletDeployerWrapper,
    contractKit: ContractKit,
    logger: KomenciLoggerService
  ) => {
    const relayer = networkCfg.relayers.find(r => {
      return normalizeAddress(r.externalAccount) === normalizeAddress(walletCfg.address)
    })

    if (relayer === undefined) {
      logger.logAndThrow(new RelayerNotRegisteredError())
    }

    if (isValidAddress(relayer.metaTransactionWallet)) {
      logger.event(EventType.RelayerMTWInit, {
        mtwAddress: relayer.metaTransactionWallet
      })

      return contractKit.contracts.getMetaTransactionWallet(
        relayer.metaTransactionWallet
      )
    } else {
      logger.logAndThrow(new NoMTWError({configAddress: relayer.metaTransactionWallet}))
    }
  },
  inject: [
    networkConfig.KEY,
    walletConfig.KEY,
    MetaTransactionWalletDeployerWrapper,
    ContractKit,
    KomenciLoggerService
  ]
}

