import { IsNotEmpty, ValidateIf } from 'class-validator'

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
}
