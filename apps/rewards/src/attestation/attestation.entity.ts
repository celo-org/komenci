import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export enum RewardStatus {
  Created = 'Created',
  Sent = 'Sent',
  Failed = 'Failed'
}

@Entity()
export class Attestation {
  public static of(params: Partial<Attestation>): Attestation {
    const attestation = new Attestation()
    Object.assign(attestation, params)
    return attestation
  }

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  txHash: string

  @Column()
  address: string

  @Column()
  identifier: string

  @Column('timestamp')
  createdAt: string
}
