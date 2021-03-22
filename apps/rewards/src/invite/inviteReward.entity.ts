import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum RewardStatus {
  Created = 'Created',
  Sent = 'Sent',
  Failed = 'Failed'
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

  @Column()
  state: RewardStatus

  @Column()
  rewardTxHash: string

  @Column('timestamp')
  createdAt: string
}
