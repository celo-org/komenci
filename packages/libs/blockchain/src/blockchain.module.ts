import { AllExceptionFilter } from '@komenci/logger/dist/filters/global-error.filter'
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import {
  BLOCKCHAIN_MODULE_OPTIONS,
  contractKitDef,
  walletDef,
  web3Def,
  web3ProviderDef,
} from './blockchain.providers'
import { BlockchainService } from './blockchain.service'
import { NodeConfig } from './config/node.config'
import { WalletConfig, } from './config/wallet.config'

export interface BlockchainOptions {
  node: NodeConfig
  wallet?: WalletConfig
}

export interface AsyncOptions<TOptions> extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[] ) => Promise<TOptions> | TOptions
  inject?: any[]
}


@Module({})
export class BlockchainModule {
  public static forRootAsync(options: AsyncOptions<BlockchainOptions>): DynamicModule {
    const providers = this.providers()
    return {
      global: true,
      module: BlockchainModule,
      imports: options.imports,
      providers: [
        {
          provide: BLOCKCHAIN_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        BlockchainService,
        ...providers,
        { 
          provide: APP_FILTER,
          useClass: AllExceptionFilter,
        }
      ],
      exports: [
        BlockchainService,
        ...providers.map(p => p.provide)
      ]
    }
  }

  private static providers() {
    return [
      web3ProviderDef,
      walletDef,
      web3Def,
      contractKitDef,
    ]
  }
}
