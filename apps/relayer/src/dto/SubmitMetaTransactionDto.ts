import { IsCeloAddress } from '@app/onboarding/utils/validators'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { IsHexadecimal, IsNotEmpty, IsNumberString } from 'class-validator'

export class SubmitMetaTransactionDto {
  @IsCeloAddress()
  destination: string

  @IsHexadecimal()
  data: string
}
