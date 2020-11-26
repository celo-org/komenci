import { ApiError, isApiError, isMetadataError, isRootError, MetadataError } from '@app/komenci-logger/errors'
import { RootError } from '@celo/base'
import { isError } from '@nestjs/cli/lib/utils/is-error'
import { Injectable, LoggerService } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'

import { EventPayload } from '@app/komenci-logger/events'

export interface KomenciLogger extends LoggerService {
  event: <K extends keyof EventPayload>(eventType: K, payload: EventPayload[K]) => void
}

interface EventContext {
  traceId: string,
  labels: Array<{key: string, value: string}>
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

  error(error: any, trace?: string, context?: any, ...args): void {
    if (isApiError(error) || isMetadataError(error)) {
      this.logger.error(
        { error: error.errorType, ...error.getMetadata() },
        error.stack,
      )
    } else if (isRootError(error)) {
      this.logger.error(
        { error: error.errorType, },
        error.stack,
      )
    } else if (isError(error)) {
      this.logger.error((error as Error).stack, context, ...args)
    } else {
      this.logger.error(trace || error, context, ...args)
    }
  }

  errorWithContext(error: Error, ctx: EventContext) {
    const context = this.expandContext(ctx)
    if (isApiError(error) || isMetadataError(error)) {
      this.logger.error(
        {
          error: error.errorType,
          ...error.getMetadata(),
          ...context
        },
      )
    } else if (isRootError(error)) {
      this.logger.error(
        { error: error.errorType, ...context },
        error.stack,
      )
    } else if (isError(error)) {
      this.logger.error(context, (error as Error).stack)
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
