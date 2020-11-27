import { RelayerCommandDto } from 'apps/relayer/src/dto/RelayerCommandDto'
import {
  IsBase64,
  IsOptional,
  IsString
} from 'class-validator'

export class GetPhoneNumberSignatureDto extends RelayerCommandDto {
  @IsString()
  @IsBase64()
  blindedPhoneNumber: string

  @IsString()
  @IsOptional()
  clientVersion: string
}
