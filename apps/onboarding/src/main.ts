import { ValidationPipe } from '@nestjs/common'
import { ConfigService, ConfigType } from '@nestjs/config'
import { NestApplication, NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { appConfig } from './config/app.config'
import { ApiErrorFilter } from './errors/api-error.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(
   AppModule,
   {
     logger: false
   }
  )

  // const logger = app.get(Logger)
  app.useLogger(app.get(Logger))
  const cfg = app.get(ConfigService).get<ConfigType<typeof appConfig>>('app')
  // logger.log(`Starting HTTP server on  ${cfg.host}:${cfg.port}`)
  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new ApiErrorFilter())

  await app.listen(cfg.port, cfg.host)
}

// tslint:disable-next-line: no-floating-promises
bootstrap()
