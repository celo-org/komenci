import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AttestationRepository } from '../attestation/attestation.repository'
import { NotifiedBlockRepository } from '../blocks/notifiedBlock.repository'
import { NotifiedBlockService } from '../blocks/notifiedBlock.service'
import { EventService } from '../event/eventService.service'
import { InviteRewardRepository } from './inviteReward.repository'
import { InviteRewardService } from './inviteReward.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([InviteRewardRepository]),
    TypeOrmModule.forFeature([AttestationRepository]),
    TypeOrmModule.forFeature([NotifiedBlockRepository])
  ],
  providers: [InviteRewardService, NotifiedBlockService, EventService],
  exports: [TypeOrmModule]
})
export class InviteRewardModule {}
