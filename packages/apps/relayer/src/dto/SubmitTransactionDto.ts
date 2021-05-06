import { ValidateNested } from 'class-validator'
import { RawTransactionDto } from './RawTransactionDto'
import { RelayerCommandDto } from './RelayerCommandDto'

export class SubmitTransactionDto extends RelayerCommandDto {
  @ValidateNested()
  transaction: RawTransactionDto
}

