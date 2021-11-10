import { BlockchainModule, ContractsModule } from '@komenci/blockchain'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { WalletConfig, walletConfig } from '@komenci/blockchain/dist/config/wallet.config'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { KomenciLoggerModule } from '@komenci/logger'
import { AllExceptionFilter } from '@komenci/logger/dist/filters/global-error.filter'
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { AppController } from './app.controller'
import { BalanceService } from './chain/balance.service'
import { TransactionService } from './chain/transaction.service'
import { appConfig, AppConfig } from './config/app.config'
import { metaTransactionWalletProvider } from './contracts/MetaTransactionWallet.contract'
import { loggerConfigFactory } from './logger-config.factory'
import { OdisService } from './odis/odis.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, networkConfig, walletConfig],
      envFilePath: [
        './.env.local',
        './.env',
      ]
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        const appCfg = config.get<AppConfig>('app')
        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL,
            nodeApiKey: appCfg.fornoApiKey,
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
      useFactory: loggerConfigFactory
    }),
    HttpModule
  ],
  controllers: [AppController],
  providers: [
    OdisService,
    TransactionService,
    BalanceService,
    metaTransactionWalletProvider,
    { 
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    }
  ]
})
export class AppModule {}
