import { EntityRepository, Repository } from 'typeorm'
import { AddressMappings } from './addressMappings.entity'

@EntityRepository(AddressMappings)
export class AddressMappingsRepository extends Repository<AddressMappings> {
  async findAccountAddresses(walletAddress: string) {
    const accountAddresses = (await this.find({ walletAddress })).map(
      (mapping) => mapping.accountAddress
    )
    return accountAddresses.length > 0 ? accountAddresses : [walletAddress]
  }
}
