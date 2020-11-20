import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { KomenciLoggerModule } from '@app/komenci-logger'
import { RpcErrorFilter } from '@app/komenci-logger/filters/rpc-error.filter'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BalanceService } from 'apps/relayer/src/chain/balance.service'
import { OdisService } from 'apps/relayer/src/odis/odis.service'
import { AppController } from './app.controller'
import { TransactionService } from './chain/transaction.service'
import { appConfig, AppConfig } from './config/app.config'
import { metaTransactionWalletProvider } from './contracts/MetaTransactionWallet.contract'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, networkConfig, walletConfig],
      envFilePath: [
        'apps/relayer/.env.local',
        'apps/relayer/.env',
      ]
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          },
          wallet: config.get<WalletConfig>('wallet'),
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const wallet = config.get<WalletConfig>('wallet')
        const network = config.get<NetworkConfig>('network')

        return {
          deployerAddress: network.contracts.MetaTransactionWalletDeployer,
          walletAddress: wallet.address
        }
      }
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<AppConfig>('app')
        const walletCfg = config.get<WalletConfig>('wallet')

        return {
          pinoHttp: {
            name: `relayer-service`,
            mixin: () => ({
              relayer: walletCfg.address
            }),
            messageKey: 'message',
            level: appCfg.logLevel,
            prettyPrint: process.env.NODE_ENV !== 'production'
          }
        }
      }
    }),
    HttpModule
  ],
  controllers: [AppController],
  providers: [
    RpcErrorFilter,
    OdisService,
    TransactionService,
    BalanceService,
    metaTransactionWalletProvider,
  ]
})
export class AppModule {}
