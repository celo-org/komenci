import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppConfig } from 'apps/onboarding/src/config/app.config';
import { AppModule } from './app.module';
import { Logger } from "nestjs-pino";


async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: false
    }
  );
  const logger = app.get(Logger)
  app.useLogger(logger)
  const appConfig = app.get(ConfigService).get<AppConfig>("app")
  logger.log(`Starting HTTP server on  ${appConfig.host}:${appConfig.port}`)
  await app.listen(appConfig.port, appConfig.host);
}
bootstrap();
