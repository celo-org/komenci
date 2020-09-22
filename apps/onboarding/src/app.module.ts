import { HttpModule, Logger, Module } from '@nestjs/common'
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config'
import { ClientProxyFactory, TcpClientOptions } from '@nestjs/microservices'
import { TypeOrmModule } from "@nestjs/typeorm"
import { LoggerModule } from 'nestjs-pino/dist'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import appConfig from './config/app.config'
import relayerConfig from './config/relayer.config'
import thirdPartyConfig from './config/third-party.config'
import { GatewayModule } from './gateway/gateway.module'
import { RelayerProxyService } from './relayer_proxy.service'
import { SessionModule } from './session/session.module'

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [relayerConfig, appConfig, thirdPartyConfig],
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
    TypeOrmModule.forRoot({
      "type": "postgres",
      "host": "localhost",
      "port": 5432,
      "username": "postgres",
      "password": "docker",
      "database": "postgres",
      "autoLoadEntities": true,
      "keepConnectionAlive": true,
      "synchronize": true, // Only for DEV
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
