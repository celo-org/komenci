import { KomenciLoggerService } from '@app/komenci-logger'
import { networkConfig, NetworkConfig } from '@app/utils/config/network.config'
import { isAccountConsideredVerified } from '@celo/base/lib'
import { CeloContract, ContractKit } from '@celo/contractkit'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Raw } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { NotifiedBlock } from '../blocks/notifiedBlock.entity'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { InviteReward, RewardStatus } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'

const WEEKLY_INVITE_LIMIT = 20

@Injectable()
export class InviteRewardService {
  isRunning = false
  komenciAddresses = []

  constructor(
    private readonly inviteRewardRepository: InviteRewardRepository,
    private readonly notifiedBlockRepository: NotifiedBlockRepository,
    private readonly contractKit: ContractKit,
    @Inject(networkConfig.KEY)
    private readonly networkCfg: NetworkConfig,
    private readonly logger: KomenciLoggerService
  ) {
    this.komenciAddresses = this.networkCfg.relayers.map(
      relayer => relayer.externalAccount
    )
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sendInviteRewards() {
    if (this.isRunning) {
      this.logger.log('Skipping because previous run is still ongoing')
      return
    }
    this.isRunning = true

    const cUsdTokenAddress = (
      await this.contractKit.registry.addressFor(CeloContract.StableToken)
    ).toLowerCase()

    await this.usingLastNotifiedBlock(async fromBlock => {
      this.logger.log(
        `Starting to fetch invite rewards from block ${fromBlock}`
      )
      const escrow = await this.contractKit.contracts.getEscrow()
      const withdrawalEvents = await escrow.getPastEvents('Withdrawal', {
        fromBlock
      })
      this.logger.log(`Withdrawal events received: ${withdrawalEvents.length}`)
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
        if (!this.isKomenciSender(tx.from)) {
          continue
        }
        const invitee = tx.to?.toLowerCase() ?? ''
        const conditions = await Promise.all([
          this.addressIsConsideredVerified(inviter, identifier),
          this.addressIsConsideredVerified(invitee, identifier),
          this.inviterHasNotReachedWeeklyLimit(inviter),
          this.inviteeRewardNotInProgress(invitee)
        ])
        if (conditions.every(condition => condition)) {
          this.logger.log(
            `Starting to send reward to ${inviter} for inviting ${invitee}`
          )
          try {
            const inviteReward = await this.createInviteReward(inviter, invitee)
            this.sendInviteReward(inviteReward)
          } catch (error) {
            this.logger.log(`Error creating and sending reward ${error}`)
          }
        }
      }
      return maxBlock
    })

    this.isRunning = false
  }

  async usingLastNotifiedBlock(fn: (blockNumber: number) => Promise<number>) {
    try {
      let lastNotifiedBlock = await this.notifiedBlockRepository.findOne({
        key: 'inviteReward'
      })
      if (!lastNotifiedBlock) {
        lastNotifiedBlock = {
          id: uuidv4(),
          key: 'inviteReward',
          // TODO: Replace this by the correct starting block in alfajores and mainnet.
          // For now, putting a high value to avoid potential issues if this is accidentally deployed.
          blockNumber: 100000000
        }
      }
      const fromBlock = lastNotifiedBlock.blockNumber + 1
      const lastBlock = await fn(fromBlock)
      if (lastBlock > fromBlock) {
        await this.notifiedBlockRepository.save(
          NotifiedBlock.of({
            id: lastNotifiedBlock.id,
            key: lastNotifiedBlock.key,
            blockNumber: lastBlock
          })
        )
      }
    } catch (error) {
      this.logger.log(`Error while calculating invite rewards: ${error}`)
    }
  }

  isKomenciSender(address: string) {
    return this.komenciAddresses.includes(address.toLowerCase())
  }

  async addressIsConsideredVerified(address: string, identifier: string) {
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
    const inviteReward = InviteReward.of({
      id: uuidv4(),
      inviter,
      invitee,
      state: RewardStatus.Created,
      createdAt: new Date(Date.now()).toISOString()
    })
    return this.inviteRewardRepository.save(inviteReward)
  }

  sendInviteReward(invite: InviteReward) {
    // TODO: Send using HSM
  }
}
