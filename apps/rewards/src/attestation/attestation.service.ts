import { KomenciLoggerService } from '@app/komenci-logger'
import { ContractKit } from '@celo/contractkit'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { v4 as uuidv4 } from 'uuid'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { fetchEvents } from '../utils/fetchEvents'
import { Attestation } from './attestation.entity'
import { AttestationRepository } from './attestation.repository'

const NOTIFIED_BLOCK_KEY = 'attestation'

@Injectable()
export class AttestationService {
  isRunning = false

  constructor(
    private readonly attestationRepository: AttestationRepository,
    private readonly notifiedBlockService: NotifiedBlockService,
    private readonly contractKit: ContractKit,
    private readonly logger: KomenciLoggerService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async fetchAttestations() {
    if (this.isRunning) {
      this.logger.log('Skipping because previous run is still ongoing')
      return
    }
    this.isRunning = true
    try {
      await this.usingLastNotifiedBlock(async fromBlock => {
        this.logger.log(
          `Starting to fetch attestations from block ${fromBlock}`
        )

        const attestationEvents = await this.fetchAttestationEvents(fromBlock)
        this.logger.log(
          `Attestation events received: ${attestationEvents.length}`
        )
        let maxBlock = fromBlock
        for (const attestationRequest of attestationEvents) {
          const {
            transactionHash,
            blockNumber,
            returnValues: { identifier, account }
          } = attestationRequest
          maxBlock = Math.max(maxBlock, blockNumber)
          await this.createAttestation(
            transactionHash,
            account.toLowerCase(),
            identifier
          )
        }
        return maxBlock
      })
    } finally {
      this.isRunning = false
    }
  }

  async usingLastNotifiedBlock(
    attestationEventsFn: (blockNumber: number) => Promise<number>
  ) {
    await this.notifiedBlockService.runUsingLastNotifiedBlock(
      NOTIFIED_BLOCK_KEY,
      () => Promise.resolve(0),
      attestationEventsFn
    )
  }

  async fetchAttestationEvents(fromBlock: number) {
    const lastBlock = await this.contractKit.web3.eth.getBlockNumber()
    const attestations = await this.contractKit.contracts.getAttestations()
    return fetchEvents(
      attestations,
      'AttestationCompleted',
      fromBlock,
      lastBlock
    )
  }

  async createAttestation(txHash: string, address: string, identifier: string) {
    try {
      const attestation = await this.attestationRepository.save(
        Attestation.of({
          id: uuidv4(),
          txHash,
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
