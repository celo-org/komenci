import { KomenciLoggerService } from '../komenci-logger.service'
import { isMetadataError, isRootError } from '@komenci/core'

import {
  ArgumentsHost,
  Catch,
  Inject,
} from '@nestjs/common'
import { BaseRpcExceptionFilter } from '@nestjs/microservices'
import { Observable, throwError as _throw } from 'rxjs'

@Catch()
export class RpcErrorFilter extends BaseRpcExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  catch(err: any, host: ArgumentsHost): Observable<any> {
    this.logger.error(err)

    if (isMetadataError(err)) {
      return _throw({
        errorType: err.errorType,
        message: err.message,
        metadata: err.getMetadata()
      })
    } else if (isRootError(err)) {
      return _throw({
        errorType: err.errorType,
        message: err.message
      })
    } else if (this.isError(err)) {
      return _throw({
        errorType: 'Exception',
        message: err.message
      })
    } else {
      return _throw(err)
    }
  }
}
