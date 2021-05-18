import { EventLog } from '@celo/connect'
import { AnalyticsService } from '@komenci/analytics'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Injectable, Scope } from '@nestjs/common'
import {
  NotifiedBlockService,
  StartingBlock
} from '../blocks/notifiedBlock.service'

@Injectable({
  scope: Scope.TRANSIENT
})
export class EventService {
  isRunning = false

  constructor(
    private readonly notifiedBlockService: NotifiedBlockService,
    private readonly logger: KomenciLoggerService,
    private readonly analytics: AnalyticsService
  ) {}

  async runEventProcessingPolling(
    key: string,
    startingBlock: StartingBlock,
    eventFetcher: (fromBlock: number) => Promise<EventLog[]>,
    eventHandler: (event: EventLog) => Promise<void>
  ) {
    if (this.isRunning) {
      this.logger.debug(
        `Skipping because previous run of ${key} is still ongoing`
      )
      return
    }
    this.isRunning = true
    try {
      await this.notifiedBlockService.runUsingLastNotifiedBlock(
        key,
        startingBlock,
        fromBlock =>
          this.fetchAndProcessEvents(key, fromBlock, eventFetcher, eventHandler)
      )
    } finally {
      this.isRunning = false
    }
  }

  async fetchAndProcessEvents(
    key: string,
    fromBlock: number,
    eventFetcher: (fromBlock: number) => Promise<EventLog[]>,
    eventHandler: (event: EventLog) => Promise<void>
  ) {
    this.logger.debug(`Starting to fetch ${key} events from block ${fromBlock}`)

    const events = await eventFetcher(fromBlock)
    let maxBlock = fromBlock
    for (const event of events) {
      try {
        await eventHandler(event)
      } catch (error) {
        this.analytics.trackEvent(EventType.UnexpectedError, {
          origin: `Processing ${key} event: ${JSON.stringify(event)}`,
          error: error
        })
        throw error
      }
      maxBlock = Math.max(maxBlock, event.blockNumber)
    }
    return maxBlock
  }
}
