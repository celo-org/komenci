import { KomenciLoggerService } from '@app/komenci-logger'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { TcpOptions, Transport } from '@nestjs/microservices'
import { AppModule } from './app.module'
import { AppConfig } from './config/app.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const appConfig = app.get(ConfigService).get<AppConfig>('app')
  app.connectMicroservice<TcpOptions>({
    transport: Transport.TCP,
    options: {
      host: appConfig.host,
      port: appConfig.port
    }
  })

  const logger = app.get(KomenciLoggerService)
  app.useLogger(logger)
  await app.init()

  app.startAllMicroservices(() => {
    logger.log(
      `Microservice is listening on ${appConfig.host}:${appConfig.port}`
    )
  })

  app.useGlobalPipes(new ValidationPipe())
}

// tslint:disable-next-line: no-floating-promises
bootstrap()
