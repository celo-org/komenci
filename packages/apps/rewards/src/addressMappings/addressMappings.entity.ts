import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({
  name: 'account_wallet_mapping'
})
export class AddressMappings {
  public static of(params: Partial<AddressMappings>): AddressMappings {
    const addressMapping = new AddressMappings()
    Object.assign(addressMapping, params)
    return addressMapping
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
