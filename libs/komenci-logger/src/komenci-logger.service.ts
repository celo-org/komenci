import { Injectable, LoggerService } from '@nestjs/common'
import { Logger } from "nestjs-pino"

import { KEvent } from '@app/komenci-logger/events'

export interface KomenciLogger extends LoggerService {
    logEvent: (event: KEvent) => void
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
    error(message: any, context?: any, ...args): void {
        this.logger.error(message, context, ...args)
    }

    logEvent(event: KEvent): void {
        this.log(event.type, event)
    }
}
