import { BlockchainModule } from '@app/blockchain';
import { HttpModule, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino/dist'
import { AppController } from './app.controller'
import appConfig, { AppConfig } from './config/app.config'
import { nodeConfigParser, NodeConfig } from '@app/blockchain/config/node.config'
import { RelayerService } from './relayer.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, nodeConfigParser],
      envFilePath: ['apps/onboarding/.env.local']
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          nodeConfig: config.get<NodeConfig>('nodeConfig')
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
