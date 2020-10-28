import { ArgumentsHost, Catch, HttpServer, HttpStatus, Inject, Optional } from '@nestjs/common'
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core'
import { MESSAGES } from '@nestjs/core/constants'
import { Logger } from 'nestjs-pino'

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
    if (ApiError.isApiError(exception)) {
      const apiError = exception as ApiError<any>
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
      if (this.isExceptionObject(exception)) {
        return this.logger.error(
          exception.message,
          exception.stack,
        )
      }
      return this.logger.error(exception)
    }
  }
}