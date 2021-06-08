import { Controller, Get, Query, Req } from '@nestjs/common'
import { InviteReward } from './inviteReward.entity'
import { InviteRewardRepository } from './inviteReward.repository'

@Controller()
export class InviteRewardController {
  constructor(
    private readonly inviteRewardRepository: InviteRewardRepository,
  ) {}

  @Get('invite_reward')
  async inviteReward(@Query('tx_hash') txHash): Promise<InviteReward> {
    return this.inviteRewardRepository.findOne({ rewardTxHash: txHash })
  }
}
