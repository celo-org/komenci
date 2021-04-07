import { KomenciLoggerService } from '@app/komenci-logger'
import { networkConfig, NetworkConfig } from '@app/utils/config/network.config'
import { isAccountConsideredVerified } from '@celo/base/lib'
import { EventLog } from '@celo/connect'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Not, Raw } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { AttestationRepository } from '../attestation/attestation.repository'
import { EventService } from '../event/eventService.service'
import { fetchEvents } from '../utils/fetchEvents'
import { InviteReward, RewardStatus } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'

const NOTIFIED_BLOCK_KEY = 'inviteReward'
const WEEKLY_INVITE_LIMIT = 20

@Injectable()
export class InviteRewardService {
  isRunning = false
  komenciAddresses = []
  cUsdTokenAddress = null

  constructor(
    private readonly inviteRewardRepository: InviteRewardRepository,
    private readonly attestationRepository: AttestationRepository,
    private readonly eventService: EventService,
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
    this.cUsdTokenAddress = (
      await this.contractKit.registry.addressFor(CeloContract.StableToken)
    ).toLowerCase()

    await this.eventService.runEventProcessingPolling(
      NOTIFIED_BLOCK_KEY,
      () => this.contractKit.web3.eth.getBlockNumber(),
      this.fetchWithdrawalEvents.bind(this),
      this.handleWithdrawalEvent.bind(this)
    )
  }

  async fetchWithdrawalEvents(fromBlock: number) {
    const lastBlock = await this.contractKit.web3.eth.getBlockNumber()
    const escrow = await this.contractKit.contracts.getEscrow()
    return fetchEvents(escrow, 'Withdrawal', fromBlock, lastBlock)
  }

  async handleWithdrawalEvent(withdrawalEvent: EventLog) {
    const {
      transactionHash,
      returnValues: { identifier, token, to }
    } = withdrawalEvent

    const inviter = to.toLowerCase()
    if (this.cUsdTokenAddress !== token.toLowerCase()) {
      return
    }
    const tx = await this.contractKit.web3.eth.getTransaction(transactionHash)
    const invitee = tx.to?.toLowerCase()
    if (!invitee) {
      return
    }
    if (!this.isKomenciSender(tx.from)) {
      return
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
      const inviteReward = await this.createInviteReward(
        inviter,
        invitee,
        identifier
      )
      if (inviteReward) {
        this.sendInviteReward(inviteReward)
      }
    }
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

  async createInviteReward(
    inviter: string,
    invitee: string,
    inviteeIdentifier: string
  ) {
    try {
      const inviteReward = InviteReward.of({
        id: uuidv4(),
        inviter,
        invitee,
        inviteeIdentifier,
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
