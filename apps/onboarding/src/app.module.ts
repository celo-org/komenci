import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, ClientsModule, TcpClientOptions } from '@nestjs/microservices';
import { RelayerProxyService } from 'apps/onboarding/src/relayer_proxy.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import relayerConfig from './config/relayer.config';
import httpConfig from "./config/http.config";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      load: [relayerConfig, httpConfig],
      envFilePath: ['apps/onboarding/.env.local'],
    })
  ],
  providers: [
    AppService,
    RelayerProxyService,
    {
      provide: 'RELAYER_SERVICE',
      useFactory: (configService: ConfigService) => {
        const relayerSvcOptions = configService.get<TcpClientOptions>('relayer');
        const logger = new Logger("RelayerService");
        logger.log(`Pointing RelayerProxy to: ${relayerSvcOptions.options.host}:${relayerSvcOptions.options.port}`)
        return ClientProxyFactory.create(relayerSvcOptions)
      },
      inject: [ConfigService]
    }
  ],
})
export class AppModule {}
