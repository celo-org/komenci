import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString
} from 'class-validator'

export class DistributedBlindedPepperDto {
  @IsString()
  blindedPhoneNumber: string

  @IsString()
  @IsOptional()
  clientVersion: string
}
