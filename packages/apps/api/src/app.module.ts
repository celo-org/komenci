import { BlockchainModule, ContractsModule } from '@komenci/blockchain'
import { NodeProviderType } from '@komenci/blockchain/dist/config/node.config'
import { NetworkConfig, networkConfig } from '@komenci/core'
import { KomenciLoggerModule, KomenciLoggerService, loggerConfigFactory } from '@komenci/logger'
import { ApiErrorFilter } from '@komenci/logger/dist/filters/api-error.filter'
import { HttpModule, Module, Scope } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from "@nestjs/typeorm"
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { appConfig, AppConfig } from './config/app.config'
import { DatabaseConfig, databaseConfig } from './config/database.config'
import { quotaConfig } from './config/quota.config'
import { relayerConfig } from './config/relayer.config'
import { rulesConfig } from './config/rules.config'
import { thirdPartyConfig } from './config/third-party.config'
import { ThrottleConfig, throttleConfig } from './config/throttle.config'
import { GatewayModule } from './gateway/gateway.module'
import { RelayerProxyService } from './relayer/relayer_proxy.service'
import { SessionModule } from './session/session.module'
import { SessionService } from './session/session.service'
import { SubsidyService } from './subsidy/subsidy.service'
import { TxParserService } from './wallet/tx-parser.service'
import { WalletService } from './wallet/wallet.service'

@Module({
  controllers: [AppController],
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<ThrottleConfig>('throttle')
    }),
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        relayerConfig, appConfig, thirdPartyConfig,
        databaseConfig, rulesConfig, networkConfig, 
        quotaConfig, throttleConfig,
      ],
      envFilePath: ['.env.local', '.env']
    }),
    KomenciLoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<AppConfig>('app')
        return loggerConfigFactory(appCfg)
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
    TxParserService,
    SessionService,
    RelayerProxyService,
    {
      // Request scoped so that a new TCP connection is created
      // for each request in order to leverage ClusterIP load balancing
      // See: https://github.com/celo-org/komenci/pull/127
      // And: https://docs.nestjs.com/fundamentals/injection-scopes
      scope: Scope.REQUEST,
      provide: 'RELAYER_SERVICE',
      inject: [ConfigService, KomenciLoggerService],
      useFactory: (configService: ConfigService, logger: KomenciLoggerService) => {
        const relayerSvcOptions = configService.get<TcpClientOptions>('relayer')
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
