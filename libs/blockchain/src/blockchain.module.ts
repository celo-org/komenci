import { RpcWallet } from '@celo/contractkit/lib/wallets/rpc-wallet';
import { Wallet } from '@celo/contractkit/lib/wallets/wallet';
import { Module, DynamicModule, Provider, ModuleMetadata, Type } from '@nestjs/common';
import { options } from 'tsconfig-paths/lib/options';
import Web3 from 'web3';
import { HttpProvider, provider } from 'web3-core'
import { BlockchainService } from './blockchain.service'
import { NodeConfig } from './config/node.config';
import { ContractKit } from '@celo/contractkit';

export const CONTRACT_KIT = 'CONTRACT_KIT'
export const BLOCKCHAIN_MODULE_OPTIONS = 'BLOCKCHAIN_MODULE_OPTIONS'
export const WEB3 = 'WEB3'
export const WEB3_PROVIDER = 'WEB3_PROVIDER'
export const WALLET = 'WALLET'

export interface BlockchainOptions {
  nodeConfig: NodeConfig
}

interface AsyncOptions<TOptions> extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (...args: any[] ) => Promise<TOptions> | TOptions;
  inject?: any[];
  imports?: any[];
}

interface ProvidersWithOptions<TOptions> {
  provider: (opt: TOptions) => Provider,
  asyncProvider: () => Provider,
}


const buildProviders = <TOptions, InjectTypes extends any[], TValue>(token: string, inject: any[], useFactory: (options: TOptions, ...args: InjectTypes) => TValue): ProvidersWithOptions<TOptions> => {
  return {
    provider: (optss: TOptions) => {
      return {
        provide: token,
        useFactory: useFactory.bind(null, options)
      }
    },
    asyncProvider: () => {
      return {
        provide: token,
        useFactory,
        inject
      }
    }
  }
}

const web3Provider = buildProviders<BlockchainOptions, [], provider>(
  WEB3_PROVIDER,
  [BLOCKCHAIN_MODULE_OPTIONS],
  (options) => {
    return new Web3.providers.HttpProvider(options.nodeConfig.rpcURL)
  }
)

const wallet = buildProviders<BlockchainOptions, [provider], Wallet>(
  WALLET,
  [BLOCKCHAIN_MODULE_OPTIONS, WEB3_PROVIDER],
  (options, web3Provider) => {
    return new RpcWallet(web3Provider)
  }
)

const web3 = buildProviders<BlockchainOptions, [provider], Web3>(
  WEB3,
  [BLOCKCHAIN_MODULE_OPTIONS, WEB3_PROVIDER],
  (options, web3Provider) => {
    return new Web3(web3Provider)
  }
)

const contractKit = buildProviders<BlockchainOptions, [Web3, Wallet], ContractKit>(
  CONTRACT_KIT,
  [BLOCKCHAIN_MODULE_OPTIONS, WEB3, WALLET],
  (options, web3, wallet) => {
    return new ContractKit(web3, wallet)
  }
)

@Module({})
export class BlockchainModule {
  public static forRoot(options: BlockchainOptions): DynamicModule {
    return {
      module: BlockchainModule,
      providers: [
        web3Provider.provider(options),
        wallet.provider(options),
        web3.provider(options),
        contractKit.provider(options),
      ],
      exports: [
        WEB3_PROVIDER,
        WALLET,
        WEB3,
        CONTRACT_KIT
      ]
    }
  }

  public static forRootAsync(options: AsyncOptions<BlockchainOptions>): DynamicModule {
    return {
      module: BlockchainModule,
      imports: options.imports,
      providers: [
        {
          provide: BLOCKCHAIN_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        web3Provider.asyncProvider(),
        wallet.asyncProvider(),
        web3.asyncProvider(),
        contractKit.asyncProvider()
      ],
      exports: [
        WEB3_PROVIDER,
        WALLET,
        WEB3,
        CONTRACT_KIT
      ]
    }
  }
}
