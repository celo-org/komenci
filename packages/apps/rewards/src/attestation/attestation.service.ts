import { EventLog } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { KomenciLoggerService } from '@komenci/logger'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { v4 as uuidv4 } from 'uuid'
import { StartingBlock } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { fetchEvents } from '../utils/fetchEvents'
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
    private readonly logger: KomenciLoggerService
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async fetchAttestations() {
    await this.eventService.runEventProcessingPolling(
      NOTIFIED_BLOCK_KEY,
      StartingBlock.Genesis,
      this.fetchAttestationEvents.bind(this),
      this.handleAttestationRequest.bind(this)
    )
  }

  async fetchAttestationEvents(fromBlock: number) {
    const lastBlock = await this.contractKit.web3.eth.getBlockNumber()
    const attestations = await this.contractKit.contracts.getAttestations()
    return fetchEvents(
      attestations,
      ATTESTATION_COMPLETED_EVENT,
      fromBlock,
      lastBlock
    )
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
      return attestation
    } catch (error) {
      this.logger.log(
        `Error creating attestation for address ${address} 
        with identifier ${identifier}: ${error}`
      )
    }
  }
}
