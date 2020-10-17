import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { ValidateNested } from 'class-validator'

export class SubmitTransactionDto {
  @ValidateNested()
  transaction: RawTransactionDto
}

