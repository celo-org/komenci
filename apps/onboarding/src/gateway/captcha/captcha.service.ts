import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import thirdPartyConfig from 'apps/onboarding/src/config/third-party.config';

@Injectable()
export class CaptchaService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>
  ) {}

  // TODO determine what the propper input is for this
  async verifyCaptcha(input: any): Promise<boolean> {
    // this.config.recaptchaToken => would hold a token
    return false
  }
}