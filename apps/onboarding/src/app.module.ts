import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, ClientsModule, TcpClientOptions } from '@nestjs/microservices';
import { RelayerProxyService } from 'apps/onboarding/src/relayer_proxy.service';
import { LoggerModule } from 'nestjs-pino/dist';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import relayerConfig from './config/relayer.config';
import appConfig, { AppConfig } from './config/app.config';
import noir from "pino-noir"

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      load: [relayerConfig, appConfig],
      envFilePath: ['apps/onboarding/.env.local'],
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appConfig = config.get<AppConfig>('app')
        return {
          pinoHttp: {
            serializers: {
              req: (req) => {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  hostname: req.hostname,
                  remoteAddress: req.ip,
                }
              }
            },
            level: appConfig.log_level,
            prettyPrint: process.env.NODE_ENV !== 'production',
          }
        }
      }
    })
  ],
  providers: [
    AppService,
    RelayerProxyService,
    {
      provide: 'RELAYER_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const relayerSvcOptions = configService.get<TcpClientOptions>('relayer');
        const logger = new Logger("RelayerService");
        logger.log(`Pointing RelayerProxy to: ${relayerSvcOptions.options.host}:${relayerSvcOptions.options.port}`)
        return ClientProxyFactory.create(relayerSvcOptions)
      },
    },
  ],
})
export class AppModule {}
