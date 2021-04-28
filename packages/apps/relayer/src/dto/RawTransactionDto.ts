import { IsCeloAddress } from '@app/onboarding/utils/validators'
import { RawTransaction } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { IsHexadecimal, IsNumberString } from 'class-validator'

export class RawTransactionDto implements RawTransaction {
  @IsCeloAddress()
  destination: string

  @IsNumberString()
  value: string

  @IsHexadecimal()
  data: string
}