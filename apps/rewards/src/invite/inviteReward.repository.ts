import { EntityRepository, Repository } from 'typeorm'
import { InviteReward } from './inviteReward.entity'

@EntityRepository(InviteReward)
export class InviteRewardRepository extends Repository<InviteReward> {}
