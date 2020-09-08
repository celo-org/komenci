import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import AppConfig from '../../onboarding/src/config/app.config';
import relayerConfig from '../../onboarding/src/config/relayer.config';
import { LoggerModule } from 'nestjs-pino/dist';
import { AppController } from './app.controller';
import { RelayerService } from './relayer.service';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      envFilePath: ['apps/onboarding/.env.local'],
    }),
    LoggerModule.forRootAsync({
      providers: [ConfigService],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const appConfig = config.get<ConfigType<typeof AppConfig>>('app')
        return {
          pinoHttp: {
            level: appConfig.log_level,
            prettyPrint: process.env.NODE_ENV !== 'production',
          }
        }
      }
    })
  ],
  controllers: [AppController],
  providers: [RelayerService],
})
export class AppModule {}
