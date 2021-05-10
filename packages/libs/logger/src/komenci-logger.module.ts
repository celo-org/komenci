import { DynamicModule, Global, Module } from '@nestjs/common'
import { LoggerModule, LoggerModuleAsyncParams, Params } from 'nestjs-pino'

import { ApiErrorFilter } from './filters/api-error.filter'
import { RpcErrorFilter } from './filters/rpc-error.filter'
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

  static forRoot(params?: Params): DynamicModule {
    return {
      module: KomenciLoggerModule,
      imports: [LoggerModule.forRoot(params)],
      providers: [KomenciLoggerService],
      exports: [KomenciLoggerService], }
  }
}
