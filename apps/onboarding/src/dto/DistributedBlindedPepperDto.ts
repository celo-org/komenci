import {
  IsBase64,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString
} from 'class-validator'

export class DistributedBlindedPepperDto {
  @IsString()
  @IsBase64()
  blindedPhoneNumber: string

  @IsString()
  @IsOptional()
  clientVersion: string
}
