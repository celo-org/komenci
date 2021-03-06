import { ContractKit } from '@celo/contractkit'
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer'
import { KomenciLoggerModule, KomenciLoggerService } from '@komenci/logger'
import { AsyncOptions } from './blockchain.module'

import { DynamicModule, Module } from '@nestjs/common'
import { Logger } from 'nestjs-pino'

export const CONTRACTS_MODULE_OPTIONS = 'CONTRACTS_MODULE_OPTIONS'

export interface ContractsOptions {
  deployerAddress: string
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
      msg: 'Initialized MetaTransactionWalletDeployer',
      address: options.deployerAddress,
    })

    return deployer
  },
  inject: [CONTRACTS_MODULE_OPTIONS, ContractKit, KomenciLoggerService]
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
        metaTransactionWalletDeployer,
        KomenciLoggerService
      ],
      exports: [
        MetaTransactionWalletDeployerWrapper
      ]
    }
  }
}
