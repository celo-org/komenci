import { DynamicModule, Global, Module } from '@nestjs/common'
import { LoggerModule, LoggerModuleAsyncParams, Params } from 'nestjs-pino'

import { KomenciLoggerService } from './komenci-logger.service'
import { RpcErrorFilter } from './filters/rpc-error.filter'
import { ApiErrorFilter } from './filters/api-error.filter'

@Global()
@Module({})
export class KomenciLoggerModule {
  static forRootAsync(params: LoggerModuleAsyncParams): DynamicModule {
    return {
      module: KomenciLoggerModule,
      imports: [LoggerModule.forRootAsync(params)],
      providers: [KomenciLoggerService, RpcErrorFilter, ApiErrorFilter],
      exports: [KomenciLoggerService, RpcErrorFilter, ApiErrorFilter],
    }
  }

  static forRoot(params?: Params): DynamicModule {
    return {
      module: KomenciLoggerModule,
      imports: [LoggerModule.forRoot(params)],
      providers: [KomenciLoggerService, RpcErrorFilter, ApiErrorFilter],
      exports: [KomenciLoggerService, RpcErrorFilter, ApiErrorFilter], }
  }
}

