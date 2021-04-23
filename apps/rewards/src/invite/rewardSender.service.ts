import { KomenciLoggerService } from '@app/komenci-logger'
import { ContractKit } from '@celo/contractkit'
import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import BigNumber from 'bignumber.js'
import { EntityManager, In, Raw, Repository } from 'typeorm'
import { appConfig, AppConfig } from '../config/app.config'
import { RelayerProxyService } from '../relayer/relayer_proxy.service'
import { InviteReward, RewardStatus } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'

const WEI_PER_UNIT = 1000000000000000000

interface WatchedInvite {
  inviteId: string
  txHash: string
  sentAt: number
  markAsDeadLetterIfFailed: boolean
}

@Injectable()
export class RewardSenderService {
  watchedInvites: Set<WatchedInvite>

  constructor(
    private readonly inviteRewardRepository: InviteRewardRepository,
    private readonly relayerProxyService: RelayerProxyService,
    @Inject(appConfig.KEY)
    private readonly appCfg: AppConfig,
    private readonly contractKit: ContractKit,
    private readonly logger: KomenciLoggerService
  ) {
    this.watchedInvites = new Set()
  }

  async wasTxSentSuccesfully(txHash: string) {
    const tx = await this.contractKit.web3.eth.getTransaction(txHash)
    return Boolean(tx.blockHash)
  }

  @Cron(CronExpression.EVERY_SECOND)
  async checkWatchedInvites() {
    await Promise.all(
      [...this.watchedInvites].map(async invite => {
        if (await this.wasTxSentSuccesfully(invite.txHash)) {
          await this.inviteRewardRepository.update(invite.inviteId, {
            state: RewardStatus.Completed
          })
          this.watchedInvites.delete(invite)
        } else if (
          Date.now() - invite.sentAt >
          this.appCfg.transactionTimeoutMs
        ) {
          await this.inviteRewardRepository.update(invite.inviteId, {
            state: invite.markAsDeadLetterIfFailed
              ? RewardStatus.DeadLettered
              : RewardStatus.Failed
          })
          this.watchedInvites.delete(invite)
        }
      })
    )
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkFailedInvites() {
    await this.inviteRewardRepository.manager.transaction(
      async (entityManager: EntityManager) => {
        const repository = entityManager.getRepository<InviteReward>(
          'invite_reward'
        )
        const invites = await repository
          .createQueryBuilder()
          .setLock('pessimistic_read')
          .where({
            state: In([RewardStatus.Submitted, RewardStatus.Failed]),
            createdAt: Raw(
              alias =>
                `${alias} <= current_timestamp - (30 ||' minutes')::interval`
            )
          })
          .getMany()
        if (invites.length > 0) {
          this.logger.log(`Found failed or submitted invites ${invites.length}`)
        }
        await Promise.all(
          invites.map(async invite => {
            if (
              invite.state === RewardStatus.Submitted &&
              (await this.wasTxSentSuccesfully(invite.rewardTxHash))
            ) {
              await repository.update(invite.id, {
                state: RewardStatus.Completed
              })
            } else {
              await this.sendInviteReward(invite, true, repository)
            }
          })
        )
      }
    )
  }

  async getRewardInCelo() {
    const rewardInCusdWei = this.appCfg.inviteRewardAmountInCusd * WEI_PER_UNIT
    const exchange = await this.contractKit.contracts.getExchange()
    const exchangeRate = await exchange.getGoldExchangeRate(
      new BigNumber(rewardInCusdWei)
    )
    return exchangeRate.multipliedBy(rewardInCusdWei).toFixed(0)
  }

  async sendInviteReward(
    invite: InviteReward,
    isRetry: boolean = false,
    repository: Repository<InviteReward> = this.inviteRewardRepository
  ) {
    const celoToken = await this.contractKit.contracts.getGoldToken()
    const tx = await celoToken.transfer(
      invite.inviter,
      await this.getRewardInCelo()
    )

    const resp = await this.relayerProxyService.submitTransaction(
      {
        transaction: {
          destination: tx.txo._parent.options.address,
          value: '0',
          data: tx.txo.encodeABI()
        }
      },
      invite.id
    )
    if (resp.ok === false) {
      this.logger.error(
        `Error sending reward for invite ${invite.id}: ${resp.error}`
      )
      await repository.update(invite.id, {
        state: isRetry ? RewardStatus.DeadLettered : RewardStatus.Failed
      })
    } else {
      const txHash = resp.result.payload
      this.logger.log(`Reward submitted for invite ${invite.id}: ${txHash}`)
      await repository.update(invite.id, {
        state: RewardStatus.Submitted,
        rewardTxHash: txHash
      })
      this.watchedInvites.add({
        inviteId: invite.id,
        txHash,
        sentAt: Date.now(),
        markAsDeadLetterIfFailed: isRetry
      })
    }
  }
}
