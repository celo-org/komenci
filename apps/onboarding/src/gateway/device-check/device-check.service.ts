import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import thirdPartyConfig from 'apps/onboarding/src/config/third-party.config';

@Injectable()
export class DeviceCheckService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>
  ) {}

  // TODO determine what the propper input is for this
  async verifyDevice(input: any): Promise<boolean> {
    // this.config.appleDeviceCheckToken -> the token
    return false
  }
}
