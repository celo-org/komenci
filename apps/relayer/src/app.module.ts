import { BlockchainModule, ContractsModule } from '@app/blockchain';
import { WalletConfig, walletConfig } from '@app/blockchain/config/wallet.config';
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino/dist'
import { AppController } from './app.controller'
import { appConfig, AppConfig } from './config/app.config'
import { nodeConfig, NodeConfig } from '@app/blockchain/config/node.config'
import { RelayerService } from './relayer.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, nodeConfig, walletConfig],
      envFilePath: ['apps/relayer/.env.local']
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          node: config.get<NodeConfig>('node'),
          wallet: config.get<WalletConfig>('wallet'),
          mtwDeployerAddress: config.get<AppConfig>('app').mtwDeployerAddress
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.get<AppConfig>('app')
        const wallet = config.get<WalletConfig>('wallet')

        return {
          metaTransactionWalletAddress: cfg.mtwDeployerAddress,
          walletAddress: wallet.address
        }
      },
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const relayerConfig = config.get<AppConfig>('app')
        return {
          pinoHttp: {
            level: relayerConfig.log_level,
            prettyPrint: process.env.NODE_ENV !== 'production'
          }
        }
      }
    }),
    HttpModule
  ],
  controllers: [AppController],
  providers: [RelayerService]
})
export class AppModule {}
