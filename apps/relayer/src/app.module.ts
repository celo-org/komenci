import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { KomenciLoggerService } from '@app/komenci-logger'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { OdisService } from 'apps/relayer/src/odis/odis.service'
import { LoggerModule } from 'nestjs-pino/dist'
import { AppController } from './app.controller'
import { appConfig, AppConfig } from './config/app.config'
import { metaTransactionWalletProvider } from './contracts/MetaTransactionWallet.contract'
import { TransactionService } from './transaction/transaction.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
<<<<<<< HEAD
      load: [appConfig, nodeConfig, walletConfig],
      envFilePath: ['apps/relayer/.env.local', 'apps/relayer/.env']
=======
      load: [appConfig, networkConfig, walletConfig],
      envFilePath: [
        'apps/relayer/.env.local',
        'apps/relayer/.env',
      ]
>>>>>>> master
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        return {
<<<<<<< HEAD
          node: config.get<NodeConfig>('node'),
          wallet: config.get<WalletConfig>('wallet')
=======
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          },
          wallet: config.get<WalletConfig>('wallet'),
>>>>>>> master
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService, KomenciLoggerService],
      useFactory: (config: ConfigService) => {
        const wallet = config.get<WalletConfig>('wallet')
        const network = config.get<NetworkConfig>('network')

        return {
          deployerAddress: network.contracts.MetaTransactionWalletDeployer,
          walletAddress: wallet.address
        }
      }
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const relayerConfig = config.get<AppConfig>('app')
        return {
          pinoHttp: {
            level: relayerConfig.logLevel,
            prettyPrint: process.env.NODE_ENV !== 'production'
          }
        }
      }
    }),
    HttpModule
  ],
  controllers: [AppController],
<<<<<<< HEAD
  providers: [OdisService, TransactionService, KomenciLoggerService]
=======
  providers: [
    OdisService,
    TransactionService,
    metaTransactionWalletProvider,
  ]
>>>>>>> master
})
export class AppModule {}
