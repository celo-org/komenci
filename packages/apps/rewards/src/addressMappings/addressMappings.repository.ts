import { EntityRepository, Repository } from 'typeorm'
import { AddressMappings } from './addressMappings.entity'

@EntityRepository(AddressMappings)
export class AddressMappingsRepository extends Repository<AddressMappings> {}
