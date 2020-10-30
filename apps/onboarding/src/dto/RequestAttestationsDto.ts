import { IsCeloAddress } from '@app/onboarding/utils/validators'
import { RawTransactionDto } from 'apps/relayer/src/dto/RawTransactionDto'
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator'

export class RequestAttestationsDto {
  @IsString()
  @IsNotEmpty()
  identifier: string

  @IsNumber()
  @IsPositive()
  attestationsRequested: number

  @IsCeloAddress()
  walletAddress: string

  @ValidateNested()
  requestTx: RawTransactionDto
}

