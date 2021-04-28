import { IsCeloAddress } from '@komenci/core'
import { RawTransactionDto } from '@komenci/relayer/dist/dto/RawTransactionDto'
import {
  IsNotEmpty,
  IsNumber, IsOptional,
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

  @IsOptional()
  @ValidateNested()
  approveTx?: RawTransactionDto
}

