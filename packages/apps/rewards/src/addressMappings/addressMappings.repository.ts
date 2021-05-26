import { EntityRepository, Repository } from 'typeorm'
import { AddressMappings } from './addressMappings.entity'

@EntityRepository(AddressMappings)
export class AddressMappingsRepository extends Repository<AddressMappings> {
  async findAccountAddress(walletAddress: string) {
    const mapping = await this.findOne({ walletAddress })
    return mapping?.accountAddress ?? walletAddress
  }
}
