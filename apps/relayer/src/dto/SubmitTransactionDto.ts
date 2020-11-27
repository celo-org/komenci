import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import { RelayerCommandDto } from 'apps/relayer/src/dto/RelayerCommandDto'
import { ValidateNested } from 'class-validator'

export class SubmitTransactionDto extends RelayerCommandDto {
  @ValidateNested()
  transaction: RawTransactionDto
}

