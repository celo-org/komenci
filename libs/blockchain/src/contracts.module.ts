import { AsyncOptions, CONTRACT_KIT } from '@app/blockchain/blockchain.module';
import { ContractKit } from '@celo/contractkit';
import { MetaTransactionWalletDeployerWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer';
import { DynamicModule, Module } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

export const CONTRACTS_MODULE_OPTIONS = 'CONTRACTS_MODULE_OPTIONS'
export const META_TRANSACTION_WALLET = 'META_TRANSACTION_WALLET'
export const META_TRANSACTION_WALLET_DEPLOYER = 'META_TRANSACTION_WALLET_DEPLOYER'

export interface ContractsOptions {
  metaTransactionWalletAddress: string
  walletAddress: string
}

const metaTransactionWalletDeployer = {
  provide: META_TRANSACTION_WALLET_DEPLOYER,
  useFactory: async (options: ContractsOptions, contractKit: ContractKit, logger: Logger) => {
    try {
      const deployer = await contractKit.contracts.getMetaTransactionWalletDeployer(
        options.metaTransactionWalletAddress
      )

      const canDeploy = await deployer.canDeploy(options.walletAddress)
      if (!canDeploy) {
        logger.error(`${options.walletAddress} is not allowed to deploy contracts`)
      }

      return deployer
    } catch(e) {
      logger.error(`Can not communicate with deployer at: ${options.metaTransactionWalletAddress}`)
      return null
    }
  },
  inject: [CONTRACTS_MODULE_OPTIONS, CONTRACT_KIT, Logger]
}

const metaTransactionWallet = {
  provide: META_TRANSACTION_WALLET,
  useFactory: async (
    options: ContractsOptions,
    deployer: MetaTransactionWalletDeployerWrapper,
    contractKit: ContractKit
  ) => {
    const metaTxWalletAddress = await deployer.getWallet(options.walletAddress)
    return contractKit.contracts.getMetaTransactionWallet(metaTxWalletAddress)
  },
  inject: [
    CONTRACTS_MODULE_OPTIONS,
    META_TRANSACTION_WALLET_DEPLOYER,
    CONTRACT_KIT
  ]
}

@Module({})
export class ContractsModule {
  public static forRootAsync(options: AsyncOptions<ContractsOptions>): DynamicModule {
    return {
      global: true,
      module: ContractsModule,
      imports: options.imports,
      providers: [
        {
          provide: CONTRACTS_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        metaTransactionWallet,
        metaTransactionWalletDeployer,
      ],
      exports: [
        META_TRANSACTION_WALLET,
        META_TRANSACTION_WALLET_DEPLOYER
      ]
    }
  }
}
