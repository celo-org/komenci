import {
  IsBase64,
  IsOptional,
  IsString
} from 'class-validator'
import { RelayerCommandDto } from './RelayerCommandDto'

export class GetPhoneNumberSignatureDto extends RelayerCommandDto {
  @IsString()
  @IsBase64()
  blindedPhoneNumber: string

  @IsString()
  @IsOptional()
  clientVersion: string
}
