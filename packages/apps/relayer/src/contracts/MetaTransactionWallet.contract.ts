import { normalizeAddress, RootError } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { isValidAddress } from '@celo/utils/lib/address'
import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { MetadataError, NetworkConfig, networkConfig } from '@komenci/core'
import { EventType, KomenciLoggerService } from '@komenci/logger'

enum RelayerMTWErrorTypes {
  NotRegister = "RelayerNotRegistered",
  InvalidMTW = "InvalidMTW"
}

class RelayerNotRegisteredError extends RootError<RelayerMTWErrorTypes.NotRegister> {
  constructor() {
    super(RelayerMTWErrorTypes.NotRegister)
    this.message = `Relayer not registered as a relayer in config`
  }
}

class InvalidMTWError extends MetadataError<RelayerMTWErrorTypes.InvalidMTW> {
  metadataProps = ['address']

  constructor(readonly address: string) {
    super(RelayerMTWErrorTypes.InvalidMTW)
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
      logger.logAndThrow(new InvalidMTWError(relayer.metaTransactionWallet))
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

