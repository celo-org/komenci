import { EventLog } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { AnalyticsService } from '@komenci/analytics'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { v4 as uuidv4 } from 'uuid'
import { StartingBlock } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { Attestation } from './attestation.entity'
import { AttestationRepository } from './attestation.repository'

const NOTIFIED_BLOCK_KEY = 'attestation'
const ATTESTATION_COMPLETED_EVENT = 'AttestationCompleted'

@Injectable()
export class AttestationService {
  constructor(
    private readonly attestationRepository: AttestationRepository,
    private readonly eventService: EventService,
    private readonly contractKit: ContractKit,
    private readonly logger: KomenciLoggerService,
    private readonly analytics: AnalyticsService
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async fetchAttestations() {
    await this.eventService.runEventProcessingPolling(
      NOTIFIED_BLOCK_KEY,
      await this.contractKit.contracts.getAttestations(),
      ATTESTATION_COMPLETED_EVENT,
      StartingBlock.Genesis,
      this.handleAttestationRequest.bind(this),
      this.logEventsReceived.bind(this)
    )
  }

  logEventsReceived(fromBlock: number, eventCount: number) {
    this.logger.event(EventType.AttestationEventsFetched, {
      eventCount,
      fromBlock
    })
  }

  async handleAttestationRequest(attestationRequest: EventLog) {
    const {
      transactionHash,
      returnValues: { identifier, issuer, account }
    } = attestationRequest
    await this.createAttestation(
      transactionHash,
      issuer,
      account.toLowerCase(),
      identifier
    )
  }

  async createAttestation(
    txHash: string,
    issuer: string,
    address: string,
    identifier: string
  ) {
    try {
      const attestation = await this.attestationRepository.save(
        Attestation.of({
          id: uuidv4(),
          txHash,
          issuer,
          address,
          identifier,
          createdAt: new Date(Date.now()).toISOString()
        })
      )
      this.logger.event(EventType.AttestationCompleted, {
        txHash,
        issuer,
        address,
        identifier
      })
      return attestation
    } catch (error) {
      // Ignore expected error
      if (
        !error.message.includes(
          'duplicate key value violates unique constraint'
        )
      ) {
        this.analytics.trackEvent(EventType.UnexpectedError, {
          origin: `Creating attestation for address ${address} with identifier ${identifier}`,
          error: error
        })
      }
    }
  }
}
