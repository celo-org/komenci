import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { ServiceConfig } from 'apps/relayer/src/config/service.config';
import { AppModule } from './app.module';

const logger = new Logger("bootstrap");

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const serviceConfig = app.get(ConfigService).get<ServiceConfig>("service")
  app.connectMicroservice<TcpOptions>({
    transport: Transport.TCP,
    options: {
      host: serviceConfig.host,
      port: serviceConfig.port,
    }
  })
  await app.startAllMicroservices(() => {
    logger.log(`Microservice is listening on ${serviceConfig.host}:${serviceConfig.port}`)
  });
}
bootstrap();
