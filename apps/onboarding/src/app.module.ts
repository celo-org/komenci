import { HttpModule, Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from "@nestjs/typeorm"
import { LoggerModule } from 'nestjs-pino/dist'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import appConfig from './config/app.config'
import relayerConfig from './config/relayer.config'
import sessionConfig from './config/session.config'
import thirdPartyConfig from './config/third-party.config'
import { GatewayModule } from './gateway/gateway.module'
import { RelayerProxyService } from './relayer_proxy.service'
import { SessionModule } from './session/session.module'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [relayerConfig, appConfig, thirdPartyConfig, sessionConfig],
      envFilePath: ['apps/onboarding/.env.local']
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appCfg = config.get<ConfigType<typeof appConfig>>('app')
        return {
          pinoHttp: {
            serializers: {
              req: req => {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  hostname: req.hostname,
                  remoteAddress: req.ip
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
      imports: [ConfigService],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres' as 'postgres',
        host: config.get<ConfigType<typeof sessionConfig>>('session').host,
        port: config.get<ConfigType<typeof sessionConfig>>('session').port,
        username: config.get<ConfigType<typeof sessionConfig>>('session').username,
        password: config.get<ConfigType<typeof sessionConfig>>('session').password,
        database: config.get<ConfigType<typeof sessionConfig>>('session').database,
        autoLoadEntities: config.get<ConfigType<typeof sessionConfig>>('session').autoLoadEntities,
        keepConnectionAlive: config.get<ConfigType<typeof sessionConfig>>('session').keepConnectionAlive,
        synchronize: config.get<ConfigType<typeof sessionConfig>>('session').synchronize, // Only for DEV
      })
  }),
  ],
  providers: [
    AppService,
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
    }
  ]
})
export class AppModule {}
