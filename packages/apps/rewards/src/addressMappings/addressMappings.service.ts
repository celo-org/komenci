import { EventLog } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { AnalyticsService } from '@komenci/analytics'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { v4 as uuidv4 } from 'uuid'
import { StartingBlock } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { AddressMappings } from './addressMappings.entity'
import { AddressMappingsRepository } from './addressMappings.repository'

const NOTIFIED_BLOCK_KEY = 'addressMappings'
const ADDRESS_MAPPINGS_EVENT = 'AccountWalletAddressSet'

@Injectable()
export class AddressMappingsService {
  constructor(
    private readonly addressMappingsRepository: AddressMappingsRepository,
    private readonly eventService: EventService,
    private readonly contractKit: ContractKit,
    private readonly logger: KomenciLoggerService,
    private readonly analytics: AnalyticsService
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async fetchAddressMappings() {
    await this.eventService.runEventProcessingPolling(
      NOTIFIED_BLOCK_KEY,
      await this.contractKit.contracts.getAccounts(),
      ADDRESS_MAPPINGS_EVENT,
      StartingBlock.Genesis,
      this.handleAddressMappingsEvent.bind(this),
      this.logEventsReceived.bind(this)
    )
  }

  logEventsReceived(fromBlock: number, eventCount: number) {
    this.logger.event(EventType.AddressMappingsEventsFetched, {
      eventCount,
      fromBlock
    })
  }

  async handleAddressMappingsEvent(addressMappingEvent: EventLog) {
    const {
      transactionHash,
      returnValues: { account, walletAddress }
    } = addressMappingEvent
    await this.createAddressMapping(
      transactionHash,
      account.toLowerCase(),
      walletAddress.toLowerCase()
    )
  }

  async createAddressMapping(
    txHash: string,
    accountAddress: string,
    walletAddress: string
  ) {
    try {
      const addressMapping = await this.addressMappingsRepository.save(
        AddressMappings.of({
          id: uuidv4(),
          txHash,
          accountAddress,
          walletAddress,
          createdAt: new Date(Date.now()).toISOString()
        })
      )
      this.logger.event(EventType.AccountWalletAddressSet, {
        txHash,
        accountAddress,
        walletAddress
      })
      return addressMapping
    } catch (error) {
      // Ignore expected error
      if (
        !error.message.includes(
          'duplicate key value violates unique constraint'
        )
      ) {
        this.analytics.trackEvent(EventType.UnexpectedError, {
          origin: `Creating address mapping for account ${accountAddress} with wallet address ${walletAddress}`,
          error: error
        })
      }
    }
  }
}
