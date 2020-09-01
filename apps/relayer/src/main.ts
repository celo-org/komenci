import { NestFactory } from '@nestjs/core';
import { TcpOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const port = parseInt(process.env.PORT || "3000")
  const app = await NestFactory.createMicroservice<TcpOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port
      }
    },
  );
  app.listen(() => console.log('Microservice is listening on '+port));
}
bootstrap();
