import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator'

export class DistributedBlindedPepperDto {
    @IsNotEmpty()
    @IsPhoneNumber("ZZ")
    e164Number: string

    @IsString()
    @IsOptional()
    clientVersion: string
  }