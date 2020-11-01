import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { nodeConfig, NodeConfig } from '@app/blockchain/config/node.config'
import { ApiErrorFilter } from '@app/onboarding/errors/api-error.filter'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { HttpModule, Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from "@nestjs/typeorm"
import { RelayerProxyService } from 'apps/onboarding/src/relayer/relayer_proxy.service'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { LoggerModule } from 'nestjs-pino/dist'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { appConfig, AppConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'
import { quotaConfig } from './config/quota.config'
import { relayerConfig } from './config/relayer.config'
import { rulesConfig } from './config/rules.config'
import { thirdPartyConfig } from './config/third-party.config'
import { GatewayModule } from './gateway/gateway.module'
import { SessionModule } from './session/session.module'

@Module({
  controllers: [AppController],
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        relayerConfig, appConfig, thirdPartyConfig,
        databaseConfig, rulesConfig, nodeConfig, quotaConfig,
      ],
      envFilePath: [
        'apps/onboarding/.env.local',
        'apps/onboarding/.env',
      ]
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<AppConfig>('app')
        return {
          pinoHttp: {
            serializers: {
              req: req => {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  hostname: req.hostname,
                  remoteAddress: req.ip,
                  body: req.raw.body
                }
              }
            },
            level: appCfg.log_level,
            prettyPrint: process.env.NODE_ENV !== 'production'
          }
        }
      }
    }),
    GatewayModule,
    HttpModule,
    SessionModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get<DatabaseConfig>('database')
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          node: config.get<NodeConfig>('node'),
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const cfg = config.get<AppConfig>('app')

        return {
          deployerAddress: cfg.mtwDeployerAddress,
        }
      },
    }),
  ],
  providers: [
    SubsidyService,
    WalletService,
    SessionService,
    RelayerProxyService,
    {
      provide: 'RELAYER_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const relayerSvcOptions = configService.get<TcpClientOptions>('relayer')
        const logger = new Logger('RelayerService')
        logger.log(
          `Pointing RelayerProxy to: ${relayerSvcOptions.options.host}:${relayerSvcOptions.options.port}`
        )
        return ClientProxyFactory.create(relayerSvcOptions)
      }
    },
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter,
    }
  ]
})
export class AppModule {}
