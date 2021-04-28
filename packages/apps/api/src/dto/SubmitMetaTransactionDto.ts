import { IsCeloAddress } from '@komenci/core'
import { IsHexadecimal } from 'class-validator'

export class SubmitMetaTransactionDto {
  @IsCeloAddress()
  destination: string

  @IsHexadecimal()
  data: string
}
