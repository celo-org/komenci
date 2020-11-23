import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { ApiErrorFilter } from '@app/komenci-logger/filters/api-error.filter'
import { loggerConfigFactory } from '@app/onboarding/logger-config.factory'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { TxParserService } from '@app/onboarding/wallet/tx-parser.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Module, Scope } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from "@nestjs/typeorm"
import { RelayerProxyService } from 'apps/onboarding/src/relayer/relayer_proxy.service'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { AppController } from './app.controller'
import { AuthModule } from './auth/auth.module'
import { appConfig } from './config/app.config'
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
      useFactory: loggerConfigFactory
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
