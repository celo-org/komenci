import { ApiError, isApiError, isMetadataError, isRootError, MetadataError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base'
import { Injectable, LoggerService } from '@nestjs/common'
import { Logger } from "nestjs-pino"

import { EventPayload } from '@app/komenci-logger/events'

export interface KomenciLogger extends LoggerService {
  event: <K extends keyof EventPayload>(eventType: K, payload: EventPayload[K]) => void
}

@Injectable()
export class KomenciLoggerService implements KomenciLogger {
  constructor(private readonly logger: Logger) {}

  log(message: any, context?: any, ...args): void {
    this.logger.log(message, context, ...args)
  }

  verbose(message: any, context?: any, ...args): void {
    this.logger.verbose(message, context, ...args)
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
    this.log(eventType, payload)
  }


  private logApiError(error: ApiError<any, any>): void {
    this.logger.error(
      error.message,
      error.stack,
      {
        type: error.errorType,
        ...error.metadata
      },
    )
  }

  private logRootError(error: RootError<any>): void {
    this.error(
      error.message,
      error.stack,
      {
        type: error.errorType,
      },
    )
  }

  private logMetadataError(error: MetadataError<any, any>): void {
    this.logger.error(
      error.message,
      error.stack,
      {
        type: error.errorType,
        ...error.metadata
      },
    )
  }
}
