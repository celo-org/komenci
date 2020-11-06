import { KomenciLoggerService } from '@app/komenci-logger'
import {
  ArgumentsHost,
  Catch,
  HttpServer,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core'
import { MESSAGES } from '@nestjs/core/constants'

import { ApiError, isApiError, isRootError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base/lib/result'

@Catch()
export class ApiErrorFilter extends BaseExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  handleUnknownError(
    exception: any,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter | HttpServer
  ) {
    if (isApiError(exception)) {
      const apiError = exception as ApiError<any, any>
      const res = apiError.toJSON()
      applicationRef.reply(host.getArgByIndex(1), res, apiError.statusCode)
      return this.logger.error(apiError)
    } else {
      const body = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE
      }
      applicationRef.reply(host.getArgByIndex(1), body, body.statusCode)
      if (isRootError(exception)) {
        const rootError = exception as RootError<any>
        return this.logger.error(rootError)
      } else if (this.isExceptionObject(exception)) {
        return this.logger.error(
          exception.message,
          exception.stack
        )
      } else {
        return this.logger.error(exception)
      }
    }
  }
}
