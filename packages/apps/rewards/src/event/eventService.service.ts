import { EventLog } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { AnalyticsService } from '@komenci/analytics'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Injectable, Scope } from '@nestjs/common'
import {
  NotifiedBlockService,
  StartingBlock
} from '../blocks/notifiedBlock.service'

const EVENTS_BATCH_SIZE = 10000

@Injectable({
  scope: Scope.TRANSIENT
})
export class EventService {
  isRunning = false

  constructor(
    private readonly notifiedBlockService: NotifiedBlockService,
    private readonly contractKit: ContractKit,
    private readonly logger: KomenciLoggerService,
    private readonly analytics: AnalyticsService
  ) {}

  async runEventProcessingPolling(
    key: string,
    contract: BaseWrapper<any>,
    event: string,
    startingBlock: StartingBlock,
    eventHandler: (event: EventLog) => Promise<void>,
    eventsReceivedLogger: (block: number, eventCount: number) => void
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
        (fromBlock) =>
          this.fetchAndProcessEvents(
            key,
            contract,
            event,
            fromBlock,
            eventHandler,
            eventsReceivedLogger
          )
      )
    } finally {
      this.isRunning = false
    }
  }

  async fetchAndProcessEvents(
    key: string,
    contract: BaseWrapper<any>,
    event: string,
    fromBlock: number,
    eventHandler: (event: EventLog) => Promise<void>,
    eventsReceivedLogger: (block: number, eventCount: number) => void
  ) {
    this.logger.debug(`Starting to fetch ${key} events from block ${fromBlock}`)

    const lastBlock = await this.contractKit.web3.eth.getBlockNumber()
    const batchSize = EVENTS_BATCH_SIZE

    let maxBlock = fromBlock
    let currentFromBlock = fromBlock
    while (currentFromBlock < lastBlock) {
      const events = await contract.getPastEvents(event, {
        fromBlock: currentFromBlock,
        toBlock: Math.min(currentFromBlock + batchSize, lastBlock)
      })
      if (events.length > 0) {
        eventsReceivedLogger(currentFromBlock, events.length)
      }
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
      currentFromBlock += batchSize + 1
    }

    return maxBlock
  }
}
