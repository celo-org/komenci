import { KomenciLoggerService } from '@app/komenci-logger'
import { EventLog } from '@celo/connect'
import { Injectable, Scope } from '@nestjs/common'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'

@Injectable({
  scope: Scope.TRANSIENT
})
export class EventService {
  isRunning = false

  constructor(
    private readonly notifiedBlockService: NotifiedBlockService,
    private readonly logger: KomenciLoggerService
  ) {}

  async runEventProcessingPolling(
    key: string,
    fromBlockFetcher: () => Promise<number>,
    eventFetcher: (fromBlock: number) => Promise<EventLog[]>,
    eventHandler: (event: EventLog) => Promise<void>
  ) {
    if (this.isRunning) {
      this.logger.log('Skipping because previous run is still ongoing')
      return
    }
    this.isRunning = true
    try {
      await this.notifiedBlockService.runUsingLastNotifiedBlock(
        key,
        fromBlockFetcher,
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
    this.logger.log(`Starting to fetch ${key} events from block ${fromBlock}`)

    const events = await eventFetcher(fromBlock)
    this.logger.log(`${key} events received: ${events.length}`)
    let maxBlock = fromBlock
    for (const event of events) {
      await eventHandler(event)
      maxBlock = Math.max(maxBlock, event.blockNumber)
    }
    return maxBlock
  }
}
