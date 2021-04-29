import { IsCeloAddress } from "@komenci/core"
import { IsHexadecimal, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator'

export enum DeviceType {
  Android = 'android',
  iOS = 'ios'
}

export class StartSessionDto {
  @IsNotEmpty()
  captchaResponseToken: string

  @IsNotEmpty()
  @IsCeloAddress()
  externalAccount: string

  @IsNotEmpty()
  @IsHexadecimal()
  signature: string

  @IsOptional()
  deviceType?: DeviceType

  @ValidateIf(o => o.deviceType === DeviceType.iOS)
  @IsNotEmpty()
  iosDeviceToken?: string

  @ValidateIf(o => o.deviceType === DeviceType.Android)
  @IsNotEmpty()
  androidSignedAttestation?: string
}
