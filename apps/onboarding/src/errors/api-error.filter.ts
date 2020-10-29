import { ArgumentsHost, Catch, HttpServer, HttpStatus, Inject, Optional } from '@nestjs/common'
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core'
import { MESSAGES } from '@nestjs/core/constants'
import { Logger } from 'nestjs-pino'

import { RootError } from '@celo/base/lib/result'
import { ApiError } from './api-error'

@Catch()
export class ApiErrorFilter extends BaseExceptionFilter {
  @Optional()
  @Inject()
  protected readonly logger?: Logger

  handleUnknownError(
    exception: any,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter | HttpServer
  ) {
    if (this.isApiError(exception)) {
      const apiError = exception as ApiError<any, any>
      const res = apiError.toJSON()
      applicationRef.reply(host.getArgByIndex(1), res, apiError.statusCode)
      return this.logger.error(
        {
          message: apiError.message,
          errorType: apiError.errorType,
          metadata: apiError.metadata
        },
        apiError.stack,
      )
    } else {
      const body = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE,
      }
      applicationRef.reply(host.getArgByIndex(1), body, body.statusCode)
      if (this.isRootError(exception)) {
        const rootError = exception as RootError<any>
        return this.logger.error(
          {
            errorType: rootError.errorType,
            message: rootError.message,
          },
          rootError.stack,
        )
      } else if (this.isExceptionObject(exception)) {
        return this.logger.error(
          exception.message,
          exception.stack,
        )
      } else {
        return this.logger.error(exception)
      }
    }
  }

  isRootError(exception: any) {
    return exception.errorType !== undefined
  }

  isApiError(exception: any) {
    return exception._apiError === true
      && typeof(exception.toJSON) === 'function'
  }
}