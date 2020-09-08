import { ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import appConfig from './config/app.config';
import { AppModule } from './app.module';
import { Logger } from "nestjs-pino";


async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: true
    }
  );

  const logger = app.get(Logger)
  app.useLogger(logger)
  const cfg = app.get(ConfigService).get<ConfigType<typeof appConfig>>("app")
  logger.log(`Starting HTTP server on  ${cfg.host}:${cfg.port}`)
  await app.listen(cfg.port, cfg.host);
}
bootstrap()
