import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { HttpConfig } from 'apps/onboarding/src/config/http.config';
import { AppModule } from './app.module';

const logger = new Logger("bootstrap");

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const httpConfig = app.get(ConfigService).get<HttpConfig>("http")
  logger.log(`Starting HTTP server on  ${httpConfig.host}:${httpConfig.port}`)
  await app.listen(httpConfig.port, httpConfig.host);
}
bootstrap();
