import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { ValidateNested } from 'class-validator'

export class SubmitTransactionBatchDto {
  @ValidateNested({each: true})
  transactions: RawTransactionDto[]
}