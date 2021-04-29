import { isApiError, isMetadataError, isRootError } from '@komenci/core'
import { isError } from '@nestjs/cli/lib/utils/is-error'
import { Injectable, LoggerService } from '@nestjs/common'
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino'

import { EventPayload } from './events'

export interface KomenciLogger extends LoggerService {
  event: <K extends keyof EventPayload>(eventType: K, payload: EventPayload[K]) => void
}

interface EventContext {
  traceId: string,
  labels: Array<{key: string, value: string}>
}

@Injectable()
export class KomenciLoggerService implements KomenciLogger {
  constructor(@InjectPinoLogger() private readonly logger: PinoLogger) {
  }

  log(message: any, context?: any, ...args): void {
    this.logger.info(message, context, ...args)
  }

  verbose(message: any, context?: any, ...args): void {
    this.logger.trace(message, context, ...args)
  }

  debug(message: any, context?: any, ...args): void {
    this.logger.debug(message, context, ...args)
  }

  warn(error: any, trace?: string, context?: any, ...args): void {
    this.logError('warn', error, trace, context, ...args)
  }

  error(error: any, trace?: string, context?: any, ...args): void {
    this.logError('error', error, trace, context, ...args)
  }

  logError(level: 'error' | 'warn', error: any, trace?: string, context?: any, ...args): void {
    if (isApiError(error) || isMetadataError(error)) {
      this.logger[level](
        { error: error.errorType, ...error.getMetadata() },
        error.stack,
      )
    } else if (isRootError(error)) {
      this.logger[level](
        { error: error.errorType, },
        error.stack,
      )
    } else if (isError(error)) {
      this.logger[level]((error as Error).stack, context, ...args)
    } else {
      this.logger[level](trace || error, context, ...args)
    }
  }


  warnWithContext(error: Error, ctx?: EventContext) {
    this.logWithContext('warn', error, ctx)
  }

  errorWithContext(error: Error, ctx?: EventContext) {
    this.logWithContext('error', error, ctx)
  }

  logWithContext(level: 'error' | 'warn', error: Error, ctx?: EventContext) {
    const context = ctx ? this.expandContext(ctx) : {}
    if (isApiError(error) || isMetadataError(error)) {
      this.logger[level](
        {
          error: error.errorType,
          message: error.message,
          ...error.getMetadata(),
          ...context
        },
      )
    } else if (isRootError(error)) {
      this.logger[level](
        { 
          error: error.errorType, 
          message: error.message,
          ...context
        },
        error.stack,
      )
    } else if (isError(error)) {
      this.logger[level]({
        message: error.message,
        ...context
      }, (error as Error).stack)
    }
  }

  logAndThrow(error: any): void {
    this.error(error)
    throw(error)
  }

  event<K extends keyof EventPayload>(
    eventType: K,
    payload: EventPayload[K],
    context?: EventContext,
  ): void {
    this.log({
      event: eventType,
      ...payload,
      ...(context ? this.expandContext(context) : {})
    }, eventType)
  }

  private expandContext(context: EventContext): Record<string, string> {
    return {
      'logging.googleapis.com/trace': context.traceId,
      ...(context.labels.reduce((acc, l) => {
        acc[l.key] = l.value
        return acc
      }, {}))
    }
  }
}
