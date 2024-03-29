import { StableToken } from '@celo/contractkit'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum RewardStatus {
  Created = 'Created',
  Submitted = 'Submitted',
  Completed = 'Completed',
  Failed = 'Failed',
  DeadLettered = 'DeadLettered'
}

@Entity()
export class InviteReward {
  public static of(params: Partial<InviteReward>): InviteReward {
    const inviteReward = new InviteReward()
    Object.assign(inviteReward, params)
    return inviteReward
  }

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  inviter: string

  @Column({ unique: true })
  invitee: string

  @Column({ unique: true })
  inviteeIdentifier: string

  @Column()
  state: RewardStatus

  @Column({ unique: true })
  rewardTxHash: string

  @Column()
  inviteToken: StableToken

  @Column('timestamp')
  createdAt: string
}
