import { KomenciLoggerService } from '@app/komenci-logger'
import { networkConfig, NetworkConfig } from '@app/utils/config/network.config'
import { isAccountConsideredVerified } from '@celo/base/lib'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Not, Raw } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { AttestationRepository } from '../attestation/attestation.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { fetchEvents } from '../utils/fetchEvents'
import { InviteReward, RewardStatus } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'

const NOTIFIED_BLOCK_KEY = 'inviteReward'
const EVENTS_BATCH_SIZE = 10000
const WEEKLY_INVITE_LIMIT = 20

@Injectable()
export class InviteRewardService {
  isRunning = false
  komenciAddresses = []

  constructor(
    private readonly inviteRewardRepository: InviteRewardRepository,
    private readonly attestationRepository: AttestationRepository,
    private readonly notifiedBlockService: NotifiedBlockService,
    private readonly contractKit: ContractKit,
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    private readonly logger: KomenciLoggerService
  ) {
    this.komenciAddresses = this.networkCfg.relayers.map(
      relayer => relayer.externalAccount
    )
  }

  // This cron job will fetch Escrow events from Forno, run checks to see if we should send the inviter
  // a reward and send it if so.
  // Since there may be several instances of this service, we need to make sure we don't send more than
  // one reward for the same invitee. The invitee record is unique on the database, so any attempt to
  // create a new row with the same one will fail.
  @Cron(CronExpression.EVERY_10_SECONDS)
  async sendInviteRewards() {
    if (this.isRunning) {
      this.logger.log('Skipping because previous run is still ongoing')
      return
    }
    this.isRunning = true
    try {
      const cUsdTokenAddress = (
        await this.contractKit.registry.addressFor(CeloContract.StableToken)
      ).toLowerCase()

      await this.usingLastNotifiedBlock(async fromBlock => {
        this.logger.log(
          `Starting to fetch invite rewards from block ${fromBlock}`
        )

        const withdrawalEvents = await this.fetchWithdrawalEvents(fromBlock)
        this.logger.log(
          `Withdrawal events received: ${withdrawalEvents.length}`
        )
        let maxBlock = fromBlock
        for (const withdrawal of withdrawalEvents) {
          const {
            transactionHash,
            blockNumber,
            returnValues: { identifier, token, to }
          } = withdrawal
          maxBlock = Math.max(maxBlock, blockNumber)

          const inviter = to.toLowerCase()
          if (cUsdTokenAddress !== token.toLowerCase()) {
            continue
          }
          const tx = await this.contractKit.web3.eth.getTransaction(
            transactionHash
          )
          const invitee = tx.to?.toLowerCase()
          if (!invitee) {
            continue
          }
          if (!this.isKomenciSender(tx.from)) {
            continue
          }
          const conditions = await Promise.all([
            this.isAddressVerified(inviter),
            this.isAddressVerifiedWithIdentifier(invitee, identifier),
            this.inviterHasNotReachedWeeklyLimit(inviter),
            this.inviteeRewardNotInProgress(invitee)
          ])
          if (conditions.every(condition => condition)) {
            this.logger.log(
              `Starting to send reward to ${inviter} for inviting ${invitee}`
            )
            const inviteReward = await this.createInviteReward(inviter, invitee)
            if (inviteReward) {
              this.sendInviteReward(inviteReward)
            }
          }
        }
        return maxBlock
      })
    } finally {
      this.isRunning = false
    }
  }

  async usingLastNotifiedBlock(
    inviteRewardsSenderFn: (blockNumber: number) => Promise<number>
  ) {
    await this.notifiedBlockService.runUsingLastNotifiedBlock(
      NOTIFIED_BLOCK_KEY,
      () => this.contractKit.web3.eth.getBlockNumber(),
      inviteRewardsSenderFn
    )
  }

  async fetchWithdrawalEvents(fromBlock: number) {
    const lastBlock = await this.contractKit.web3.eth.getBlockNumber()
    const escrow = await this.contractKit.contracts.getEscrow()
    return fetchEvents(escrow, 'Withdrawal', fromBlock, lastBlock)
  }

  isKomenciSender(address: string) {
    return this.komenciAddresses.includes(address.toLowerCase())
  }

  async isAddressVerified(address: string) {
    const identifierResult = await this.attestationRepository
      .createQueryBuilder()
      .select('DISTINCT identifier')
      .where({ address })
      .getRawMany()
    const identifiers = identifierResult.map(
      identifierContainer => identifierContainer.identifier
    )
    for (const identifier of identifiers) {
      if (await this.isAddressVerifiedWithIdentifier(address, identifier)) {
        return true
      }
    }
    return false
  }

  async isAddressVerifiedWithIdentifier(address: string, identifier: string) {
    const attestations = await this.contractKit.contracts.getAttestations()
    const attestationStat = await attestations.getAttestationStat(
      identifier,
      address
    )
    return isAccountConsideredVerified(attestationStat).isVerified
  }

  async inviterHasNotReachedWeeklyLimit(inviter: string) {
    const [_, invites] = await this.inviteRewardRepository.findAndCount({
      where: {
        inviter,
        state: Not(RewardStatus.Failed),
        createdAt: Raw(alias => `${alias} >= date_trunc('week', current_date)`)
      }
    })
    return invites < WEEKLY_INVITE_LIMIT
  }

  async inviteeRewardNotInProgress(invitee: string) {
    const reward = await this.inviteRewardRepository.findOne({ invitee })
    return !reward
  }

  async createInviteReward(inviter: string, invitee: string) {
    try {
      const inviteReward = InviteReward.of({
        id: uuidv4(),
        inviter,
        invitee,
        state: RewardStatus.Created,
        createdAt: new Date(Date.now()).toISOString()
      })
      return this.inviteRewardRepository.save(inviteReward)
    } catch (error) {
      this.logger.log(`Error creating reward: ${error}`)
    }
  }

  sendInviteReward(invite: InviteReward) {
    // TODO: Send using HSM
  }
}
