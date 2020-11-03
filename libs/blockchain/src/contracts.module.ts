import { AsyncOptions } from '@app/blockchain/blockchain.module'
import { KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'

import { DynamicModule, Module } from '@nestjs/common'
import { Logger } from 'nestjs-pino'

export const CONTRACTS_MODULE_OPTIONS = 'CONTRACTS_MODULE_OPTIONS'

export interface ContractsOptions {
  deployerAddress: string
  walletAddress?: string
}

const metaTransactionWalletDeployer = {
  provide: MetaTransactionWalletDeployerWrapper,
  useFactory: async (
    options: ContractsOptions,
    contractKit: ContractKit,
    logger: Logger
  ) => {
    const deployer = await contractKit.contracts.getMetaTransactionWalletDeployer(
      options.deployerAddress
    )

    logger.log({
      message: 'Initialized MetaTxWalletDeployer',
      address: options.deployerAddress
    })

    return deployer
  },
  inject: [CONTRACTS_MODULE_OPTIONS, ContractKit, KomenciLoggerService]
}

const metaTransactionWallet = {
  provide: MetaTransactionWalletWrapper,
  useFactory: async (
    options: ContractsOptions,
    deployer: MetaTransactionWalletDeployerWrapper,
    contractKit: ContractKit,
    logger: Logger
  ) => {
    if (options.walletAddress) {
      const metaTxWalletAddress = await deployer.getWallet(
        options.walletAddress
      )
      logger.log({
        message: 'Found Relayer MetaTxWallet',
        address: metaTxWalletAddress
      })
      return contractKit.contracts.getMetaTransactionWallet(metaTxWalletAddress)
    }
  },
  inject: [
    CONTRACTS_MODULE_OPTIONS,
    MetaTransactionWalletDeployerWrapper,
    ContractKit,
    KomenciLoggerService
  ]
}

@Module({})
export class ContractsModule {
  public static forRootAsync(
    options: AsyncOptions<ContractsOptions>
  ): DynamicModule {
    return {
      global: true,
      module: ContractsModule,
      imports: [KomenciLoggerModule],
      providers: [
        {
          provide: CONTRACTS_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || []
        },
        metaTransactionWallet,
        metaTransactionWalletDeployer
      ],
      exports: [
        MetaTransactionWalletWrapper,
        MetaTransactionWalletDeployerWrapper
      ]
    }
  }
}
