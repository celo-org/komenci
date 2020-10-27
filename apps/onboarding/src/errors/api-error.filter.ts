import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common'
import { Request, Response } from 'express'

import { ApiError } from './api-error'

@Catch(ApiError)
export class ApiErrorFilter implements ExceptionFilter {
  catch(exception: ApiError<any>, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const {status, message, errorType} = exception.toJSON()

    response
      .status(status)
      .json({
        statusCode: status,
        message,
        errorType,
        timestamp: new Date().toISOString(),
        path: request.url,
      })
  }
}