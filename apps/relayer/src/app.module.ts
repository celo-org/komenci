import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RelayerService } from './relayer.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [RelayerService],
})
export class AppModule {}
