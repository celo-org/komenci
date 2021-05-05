import { KomenciLoggerService } from '@app/komenci-logger'
import { sleep } from '@celo/base'
import { CeloTransactionObject } from '@celo/connect'
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
const MAX_INVITES_PER_QUERY = 100
const REWARD_VALUE_CACHE_DURATION = 1 * 60 * 1000 // One minute

interface WatchedInvite {
  inviteId: string
  txHash: string
  sentAt: number
  // TODO: Instead of having this boolean store the number of tries on the database to allow having a configurable number
  // of tries (right now we retry only once). Update the class-level comment when this is done.
  markAsDeadLetterIfFailed: boolean
}

/**
 * Service in charge of sending with retries of rewards.
 * - When the reward is first sent using the |sendInviteReward| method, we either mark it as submitted or failed.
 * - For submitted rewards, we add them to a set of txs |watchedInvites| and we check on them with a cron job
 *     |checkWatchedInvites| every so often until they succeed and get marked as completed or they fail.
 * - For failed rewards, the cron job |checkFailedInvites| fetches them and tries to send again using
 *     |sendInviteReward|. If it fails again the invite is marked as DeadLettered.
 */
@Injectable()
export class RewardSenderService {
  watchedInvites: Set<WatchedInvite>
  rewardInCelo = {
    reward: '',
    timestamp: 0
  }
  checkingWatchedInvites = false
  checkingFailedInvites = false

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
    if (this.checkingWatchedInvites) {
      this.logger.debug(
        'Skipping checking watched invites because previous run is still running'
      )
      return
    }
    this.checkingWatchedInvites = true
    try {
      await Promise.allSettled(
        [...this.watchedInvites].map(async invite => {
          if (await this.wasTxSentSuccesfully(invite.txHash)) {
            this.logger.log(`Completed tx with hash ${invite.txHash}`)
            await this.inviteRewardRepository.update(invite.inviteId, {
              state: RewardStatus.Completed
            })
            this.watchedInvites.delete(invite)
          } else if (
            // TODO: This is timeouting but the reward might still go through. How do we check if the sending
            // actually failed for whatever reason and the tx is no longer in queue?
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
    } catch (error) {
      this.logger.error(error, 'Error checking watched invites')
    } finally {
      this.checkingWatchedInvites = false
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkFailedInvites() {
    if (this.checkingFailedInvites) {
      this.logger.debug(
        'Skipping checking failed invites because the previous run still running'
      )
      return
    }
    this.checkingFailedInvites = true
    try {
      await this.inviteRewardRepository.manager.transaction(
        async (entityManager: EntityManager) => {
          try {
            const repository = entityManager.getRepository<InviteReward>(
              'invite_reward'
            )
            const invites = await repository
              .createQueryBuilder()
              .setLock('pessimistic_write_or_fail')
              .where({
                state: In([RewardStatus.Submitted, RewardStatus.Failed]),
                createdAt: Raw(
                  alias =>
                    `${alias} <= current_timestamp - (30 ||' minutes')::interval`
                )
              })
              .limit(MAX_INVITES_PER_QUERY)
              .getMany()
            if (invites.length > 0) {
              this.logger.log(
                `Found failed or submitted invites ${invites.length}`
              )
            }
            await Promise.allSettled(
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
          } catch (error) {
            // If the caught error is that the lock is in use, ignore it since it's expected.
            if (!error.message.includes('could not obtain lock on row in relation')) {
              throw error
            }
          }
        }
      )
    } catch (error) {
      this.logger.error(error, 'Error checking failed invites')
    } finally {
      this.checkingFailedInvites = false
    }
  }

  async getRewardInCelo() {
    if (
      this.rewardInCelo.timestamp + REWARD_VALUE_CACHE_DURATION >
      Date.now()
    ) {
      return this.rewardInCelo.reward
    }
    const rewardInCusdWei = this.appCfg.inviteRewardAmountInCusd * WEI_PER_UNIT
    const exchange = await this.contractKit.contracts.getExchange()
    const exchangeRate = await exchange.getGoldExchangeRate(
      new BigNumber(rewardInCusdWei)
    )
    this.rewardInCelo = {
      timestamp: Date.now(),
      reward: exchangeRate.multipliedBy(rewardInCusdWei).toFixed(0)
    }
    return this.rewardInCelo.reward
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

    const resp = await this.sendTxThroughRelayer(tx, invite.id)
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

  private async sendTxThroughRelayer(
    tx: CeloTransactionObject<boolean>,
    inviteId: string
  ) {
    return this.relayerProxyService.submitTransaction(
      {
        transaction: {
          destination: tx.txo._parent.options.address,
          value: '0',
          data: tx.txo.encodeABI()
        }
      },
      inviteId
    )
  }
}
