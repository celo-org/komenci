import {
  BLOCKCHAIN_MODULE_OPTIONS,
  contractKitDef,
  walletDef,
  web3Def,
  web3ProviderDef,
} from '@app/blockchain/blockchain.providers'
import { BlockchainService } from '@app/blockchain/blockchain.service'
import { WalletConfig, } from '@app/blockchain/config/wallet.config'
import { FundingService } from '@app/blockchain/funding.service'
import { DynamicModule, Module, ModuleMetadata } from '@nestjs/common'
import { NodeConfig } from './config/node.config'

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
        ...this.providers()
      ],
      exports: [
        BlockchainService,
        ...this.providers().map(p => p.provide)
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
