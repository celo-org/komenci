import { IsHexadecimal, IsNotEmpty, ValidateIf } from 'class-validator'
import { IsCeloAddress } from "../utils/validators"

export enum DeviceType {
  Android = 'android',
  iOS = 'ios'
}

export class StartSessionDto {
  @IsNotEmpty()
  captchaResponseToken: string

  @IsNotEmpty()
  deviceType: DeviceType

  @ValidateIf(o => o.deviceType === DeviceType.iOS)
  @IsNotEmpty()
  iosDeviceToken?: string

  @ValidateIf(o => o.deviceType === DeviceType.Android)
  @IsNotEmpty()
  androidSignedAttestation?: string

  @IsNotEmpty()
  @IsCeloAddress()
  externalAccount: string

  @IsNotEmpty()
  @IsHexadecimal()
  signature: string
}
