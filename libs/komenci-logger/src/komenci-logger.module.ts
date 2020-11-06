import { DynamicModule, Global, Module } from '@nestjs/common'
import { LoggerModule, LoggerModuleAsyncParams } from 'nestjs-pino'

import { KomenciLoggerService } from './komenci-logger.service'

@Global()
@Module({})
export class KomenciLoggerModule {
  static forRootAsync(params: LoggerModuleAsyncParams): DynamicModule {
    return {
      module: KomenciLoggerModule,
      imports: [LoggerModule.forRootAsync(params)],
      providers: [KomenciLoggerService],
      exports: [KomenciLoggerService],
    }
  }
}

