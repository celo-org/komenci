import { BlockchainModule, ContractsModule } from '@app/blockchain'
import { NodeProviderType } from '@app/blockchain/config/node.config'
import { KomenciLoggerModule, KomenciLoggerService } from '@app/komenci-logger'
import { ApiErrorFilter } from '@app/komenci-logger/filters/api-error.filter'
import { SubsidyService } from '@app/onboarding/subsidy/subsidy.service'
import { WalletService } from '@app/onboarding/wallet/wallet.service'
import { NetworkConfig, networkConfig } from '@app/utils/config/network.config'
import { HttpModule, Logger, Module, Scope } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from "@nestjs/typeorm"
import { RelayerProxyService } from 'apps/onboarding/src/relayer/relayer_proxy.service'
import { SessionService } from 'apps/onboarding/src/session/session.service'
import { IncomingMessage, ServerResponse } from 'http'
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

        const levelToSeverity = {
          trace: 'DEBUG',
          debug: 'DEBUG',
          info: 'INFO',
          warn: 'WARNING',
          error: 'ERROR',
          fatal: 'CRITICAL',
        }

        return {
          exclude: [
            "v1/health"
          ],
          pinoHttp: {
            base: {
              ['logging.googleapis.com/labels']: {
                service: 'onboarding',
                version: appCfg.version
              }
            },
            formatters: {
              level(label: string) {
                const pinoLevel = label
                const severity = levelToSeverity[pinoLevel]
                // `@type` property tells Error Reporting to track even if there is no `stack_trace`
                // you might want to make this an option the plugin, in our case we do want error reporting for all errors, with or without a stack
                const typeProp =
                  pinoLevel === 'error' || pinoLevel === 'fatal'
                    ? {
                      '@type':
                        'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent',
                    }
                    : {}
                return { severity, ...typeProp }
              },
              log(object) {
                const logObject = object as { err?: Error }
                const stackProp = logObject?.err?.stack
                  ? { stack_trace: logObject.err.stack }
                  : {}

                const httpRequest = 'res' in object ? {
                  httpRequest: {...object},
                  res: undefined,
                  responseTime: undefined
                } : {}

                return {
                  ...object,
                  ...stackProp,
                  ...httpRequest
                }
              },
            },
            messageKey: 'message',
            customAttributeKeys: {
              req: 'logging.googleapis.com/operation'
            },
            genReqId: () => {
              return uuidv4()
            },
            customSuccessMessage: (res) => {
              return `Success`
            },
            customErrorMessage: (err, res) => {
              return `Failure: ${err.message}`
            },
            serializers: {
              httpRequest: ({res, error, responseTime}: {res: ServerResponse, error: Error, responseTime: number}) => {
                const req = (res as any).req as IncomingMessage
                return {
                  requestMethod: req.method,
                  requestUrl: req.url,
                  requestSize: `${req.readableLength}`,
                  status: res.statusCode,
                  responseSize: res.getHeader('content-length'),
                  userAgent: req.headers['user-agent'],
                  remoteIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                  referer: req.headers.referer,
                  latency: responseTime,
                }
              },
              req: (req) => {
                return {
                  id: req.id,
                }
              }
            },
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
