import { KomenciLoggerService } from '../komenci-logger.service'
import {
  ArgumentsHost,
  Catch,
  HttpServer,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core'
import { MESSAGES } from '@nestjs/core/constants'

import { isApiError } from '@komenci/core'

@Catch()
export class ApiErrorFilter extends BaseExceptionFilter {
  @Inject()
  protected readonly logger: KomenciLoggerService

  handleUnknownError(
    err: any,
    host: ArgumentsHost,
    applicationRef: AbstractHttpAdapter | HttpServer
  ) {
    this.logger.error(err)

    if (isApiError(err)) {
      const res = err.toJSON()
      applicationRef.reply(host.getArgByIndex(1), res, err.statusCode)
    } else {
      const body = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: MESSAGES.UNKNOWN_EXCEPTION_MESSAGE
      }
      applicationRef.reply(host.getArgByIndex(1), body, body.statusCode)
    }
  }
}
