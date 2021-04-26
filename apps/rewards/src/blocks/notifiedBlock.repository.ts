import { EntityRepository, Repository } from 'typeorm'
import { NotifiedBlock } from './notifiedBlock.entity'

@EntityRepository(NotifiedBlock)
export class NotifiedBlockRepository extends Repository<NotifiedBlock> {}
