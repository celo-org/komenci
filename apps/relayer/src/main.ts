import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(ConfigService).get<AppConfig>('app');
  app.connectMicroservice<TcpOptions>({
    transport: Transport.TCP,
    options: {
      host: appConfig.host,
      port: appConfig.port,
    },
  });

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.startAllMicroservices(() => {
    logger.log(
      `Microservice is listening on ${appConfig.host}:${appConfig.port}`,
    );
  });

  app.useGlobalPipes(new ValidationPipe());
}
bootstrap();
