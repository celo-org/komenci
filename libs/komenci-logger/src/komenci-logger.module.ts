import {  Module } from '@nestjs/common'
import { LoggerModule } from 'nestjs-pino'

import { KomenciLoggerService } from './komenci-logger.service'

@Module({
  imports: [LoggerModule],
  providers: [KomenciLoggerService],
  exports: [KomenciLoggerService],
})

export class KomenciLoggerModule {}

