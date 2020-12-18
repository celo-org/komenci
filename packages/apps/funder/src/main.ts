import {NestApplication, NestFactory} from '@nestjs/core';
import { AppModule } from './app.module';
import {ConfigService} from "@nestjs/config";
import {AppConfig} from "./config/app.config";
import {Logger} from "nestjs-pino";
import {ValidationPipe} from "@nestjs/common";
import {TcpOptions, Transport} from "@nestjs/microservices";

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule)
  const appConfig = app.get(ConfigService).get<AppConfig>('app')

  app.connectMicroservice<TcpOptions>({
    transport: Transport.TCP,
    options: {
      host: appConfig.host,
      port: appConfig.port
    }
  })

  const logger = app.get(Logger)
  app.useLogger(logger)
  await app.init()

  app.startAllMicroservices(() => {
    logger.log(
      `Microservice is listening on ${appConfig.host}:${appConfig.port}`
    )
  })

  app.useGlobalPipes(new ValidationPipe())

}
bootstrap();
