import { IsCeloAddress } from '@app/onboarding/utils/validators'
import { IsHexadecimal } from 'class-validator'

export class SubmitMetaTransactionDto {
  @IsCeloAddress()
  destination: string

  @IsHexadecimal()
  data: string
}
