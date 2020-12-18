import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import {ConfigModule, ConfigService} from "@nestjs/config";
import { appConfig, AppConfig } from './config/app.config'
import {NetworkConfig, networkConfig} from "@app/utils/config/network.config";
import {WalletConfig} from "@app/blockchain/config/wallet.config";
import { WatcherService } from './watcher/watcher.service';
import {KomenciLoggerModule} from "@app/komenci-logger";
import {BlockchainModule, ContractsModule} from "@app/blockchain";
import {NodeProviderType} from "@app/blockchain/config/node.config";
import {fundConfig} from "@app/utils/config/fund.config";
import {FundingService} from "@app/blockchain/funding.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, networkConfig, fundConfig],
      envFilePath: [
        'apps/funder/.env.local',
        'apps/funder/.env',
      ]
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
  controllers: [AppController],
  providers: [FundingService, WatcherService],
})
export class AppModule {}
