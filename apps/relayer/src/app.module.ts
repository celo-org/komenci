import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import httpConfig from 'apps/onboarding/src/config/http.config';
import relayerConfig from 'apps/onboarding/src/config/relayer.config';
import { AppController } from './app.controller';
import { RelayerService } from './relayer.service';
import serviceConfig from './config/service.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [serviceConfig],
      envFilePath: ['apps/onboarding/.env.local'],
    })
  ],
  controllers: [AppController],
  providers: [RelayerService],
})
export class AppModule {}
