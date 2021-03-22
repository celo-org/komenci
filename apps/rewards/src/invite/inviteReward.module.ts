import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { InviteRewardRepository } from './inviteReward.repository'
import { InviteRewardService } from './inviteReward.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteRewardRepository]),
    TypeOrmModule.forFeature([NotifiedBlockRepository])
  ],
  providers: [InviteRewardService],
  exports: [TypeOrmModule]
})
export class InviteRewardModule {}
