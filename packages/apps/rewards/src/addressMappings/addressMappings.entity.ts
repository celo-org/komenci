import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class AddressMappings {
  public static of(params: Partial<AddressMappings>): AddressMappings {
    const attestation = new AddressMappings()
    Object.assign(attestation, params)
    return attestation
  }

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  txHash: string

  @Column()
  walletAddress: string

  @Column()
  accountAddress: string

  @Column('timestamp')
  createdAt: string
}
