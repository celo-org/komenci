import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import fetch from 'node-fetch';

import thirdPartyConfig from 'apps/onboarding/src/config/third-party.config';

@Injectable()
export class CaptchaService {
  constructor(
    @Inject(thirdPartyConfig.KEY)
    private config: ConfigType<typeof thirdPartyConfig>
  ) {}

  async verifyCaptcha(input: {token: string}): Promise<boolean> {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${this.config.recaptchaToken}&response=${input.token}`
    const response = await fetch(verifyUrl)
    const {success, 'error-codes': errors} = await response.json()

    return success
  }
}