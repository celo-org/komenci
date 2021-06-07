import {BlockchainModule, ContractsModule} from "@komenci/blockchain"
import {NodeProviderType} from "@komenci/blockchain/dist/config/node.config"
import {WalletConfig} from "@komenci/blockchain/dist/config/wallet.config"
import {fundConfig} from "@komenci/cli/dist/fund.config"
import {NetworkConfig, networkConfig} from "@komenci/core"
import {KomenciLoggerModule} from "@komenci/logger"
import {Module} from '@nestjs/common'
import {ConfigModule, ConfigService} from "@nestjs/config"
import {ScheduleModule} from '@nestjs/schedule'
import {appConfig, AppConfig} from './config/app.config'
import {WatcherService} from './watcher/watcher.service'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, networkConfig, fundConfig],
      envFilePath: [ '.env.local', '.env' ]
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        return {
          deployerAddress: networkCfg.contracts.MetaTransactionWalletDeployer,
        }
      },
    }),

    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        const fundCfg = config.get<WalletConfig>('fund')

        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          },
          wallet: fundCfg
        }
      }
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<AppConfig>('app')

        return {
          pinoHttp: {
            name: `funder-service`,
            level: appCfg.logLevel,
            prettyPrint: process.env.NODE_ENV !== 'production'
          }
        }
      }
    }),
  ],
  providers: [WatcherService],
})
export class AppModule {}
