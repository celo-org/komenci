import 'source-map-support/register'

import { ValidationPipe } from '@nestjs/common'
import { ConfigService, ConfigType } from '@nestjs/config'
import { NestApplication, NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { join } from 'path'
import { AppModule } from './app.module'
import { appConfig } from './config/app.config'

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule)
  const logger = app.get(Logger)
  app.useLogger(logger)
  const cfg = app.get(ConfigService).get<ConfigType<typeof appConfig>>('app')
  logger.log(`Starting HTTP server on  ${cfg.host}:${cfg.port}`)
  app.useGlobalPipes(new ValidationPipe())
  if (process.env.NODE_ENV !== 'production') {
    app.useStaticAssets(join(__dirname, '../public'))
  }

  await app.listen(cfg.port, cfg.host)
}

// tslint:disable-next-line: no-floating-promises
bootstrap()
