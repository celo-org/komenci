import { ValidateNested } from 'class-validator'
import { RawTransactionDto } from './RawTransactionDto'
import { RelayerCommandDto } from './RelayerCommandDto'

export class SubmitTransactionBatchDto extends RelayerCommandDto {
  @ValidateNested({each: true})
  transactions: RawTransactionDto[]
}