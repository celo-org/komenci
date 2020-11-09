import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { EventType, KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { ApiErrorFilter } from '@app/komenci-logger/filters/api-error.filter'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from "@nestjs/typeorm"
import { RelayerProxyService } from 'apps/onboarding/src/relayer/relayer_proxy.service'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { v4 as uuidv4 } from "uuid"
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
        databaseConfig, rulesConfig, networkConfig, quotaConfig,
      ],
      envFilePath: ['apps/onboarding/.env.local', 'apps/onboarding/.env']
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<AppConfig>('app')
        return {
          pinoHttp: {
            genReqId: () => {
              return uuidv4()
            },
            customSuccessMessage: (res) => {
              return "RequestCompleted"
            },
            customErrorMessage: (res) => {
              return "RequestFailed"
            },
            serializers: {
              req: req => {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  hostname: req.hostname,
                  remoteAddress: req.ip,
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
      useFactory: (config: ConfigService) =>
        config.get<DatabaseConfig>('database')
    }),
    BlockchainModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const networkCfg = config.get<NetworkConfig>('network')
        return {
          node: {
            providerType: NodeProviderType.HTTP,
            url: networkCfg.fornoURL
          }
        }
      }
    }),
    ContractsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const network = config.get<NetworkConfig>('network')

        return {
          deployerAddress: network.contracts.MetaTransactionWalletDeployer,
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
      inject: [ConfigService, KomenciLoggerService],
      useFactory: (configService: ConfigService, logger: KomenciLoggerService) => {
        const relayerSvcOptions = configService.get<TcpClientOptions>('relayer')
        logger.event(EventType.RelayerProxyInit, {
          host: relayerSvcOptions.options.host,
          port: relayerSvcOptions.options.port
        })
        return ClientProxyFactory.create(relayerSvcOptions)
      }
    },
    {
      provide: APP_FILTER,
      useClass: ApiErrorFilter
    }
  ]
})
export class AppModule {}
