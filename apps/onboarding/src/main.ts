import { ValidationPipe } from '@nestjs/common'
import { ConfigService, ConfigType } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import appConfig from './config/app.config'


async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: true
    }
  )

  const logger = app.get(Logger)
  app.useLogger(logger)
  const cfg = app.get(ConfigService).get<ConfigType<typeof appConfig>>("app")
  logger.log(`Starting HTTP server on  ${cfg.host}:${cfg.port}`)
  app.useGlobalPipes(new ValidationPipe())
  
  await app.listen(cfg.port, cfg.host)
}

// tslint:disable-next-line: no-floating-promises
bootstrap()
