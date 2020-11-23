import { ApiError, isApiError, isMetadataError, isRootError, MetadataError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base'
import { Injectable, LoggerService } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'

import { EventPayload } from '@app/komenci-logger/events'

export interface KomenciLogger extends LoggerService {
  event: <K extends keyof EventPayload>(eventType: K, payload: EventPayload[K]) => void
}

@Injectable()
export class KomenciLoggerService implements KomenciLogger {
  constructor(private readonly logger: PinoLogger) {}

  log(message: any, context?: any, ...args): void {
    this.logger.info(message, context, ...args)
  }

  verbose(message: any, context?: any, ...args): void {
    this.logger.trace(message, context, ...args)
  }

  debug(message: any, context?: any, ...args): void {
    this.logger.debug(message, context, ...args)
  }

  warn(message: any, context?: any, ...args): void {
    this.logger.warn(message, context, ...args)
  }

  error(message: any, trace?: string, context?: any, ...args): void {
    if (isApiError(message)) {
      this.logApiError(message)
    } else if (isMetadataError(message)) {
      this.logMetadataError(message)
    } else if (isRootError(message)) {
      this.logRootError(message)
    } else {
      this.logger.error(message, trace, context, ...args)
    }
  }

  logAndThrow(error: any): void {
    this.error(error)
    throw(error)
  }

  event<K extends keyof EventPayload>(eventType: K, payload: EventPayload[K]): void {
    this.log({
      event: eventType,
      ...payload
    }, eventType)
  }


  private logApiError(error: ApiError<any>): void {
    this.logger.error({
        error: error.errorType,
        ...error.getMetadata()
      },
      error.stack,
      "KomenciLoggerService",
    )
  }

  private logRootError(error: RootError<any>): void {
    this.error({
        error: error.errorType,
      },
      error.stack,
      "KomenciLoggerService",
    )
  }

  private logMetadataError(error: MetadataError<any>): void {
    this.logger.error({
        error: error.errorType,
        ...error.getMetadata()
      },
      error.stack,
      "KomenciLoggerService",
    )
  }
}
