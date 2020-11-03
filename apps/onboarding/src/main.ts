import { KomenciLoggerService } from '@app/komenci-logger'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService, ConfigType } from '@nestjs/config'
import { NestApplication, NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { appConfig } from './config/app.config'

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule)
  const logger = app.get(KomenciLoggerService)
  app.useLogger(logger)
  const cfg = app.get(ConfigService).get<ConfigType<typeof appConfig>>('app')
  logger.log(`Starting HTTP server on  ${cfg.host}:${cfg.port}`)
  app.useGlobalPipes(new ValidationPipe())

  await app.listen(cfg.port, cfg.host)
}

// tslint:disable-next-line: no-floating-promises
bootstrap()
