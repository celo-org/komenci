import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { ServiceConfig } from 'apps/relayer/src/config/service.config';
import { createSecureServer } from 'http2';
import { AppModule } from './app.module';

const logger = new Logger("bootstrap");

async function bootstrap() {
  const ctx = await NestFactory.createApplicationContext(AppModule)
  const serviceConfig = ctx.get(ConfigService).get<ServiceConfig>("service")
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: serviceConfig.host,
      port: serviceConfig.port,
    }
  })
  await app.listen(() => logger.log(`Microservice is listening on ${serviceConfig.host}:${serviceConfig.port}`));
}
bootstrap();
