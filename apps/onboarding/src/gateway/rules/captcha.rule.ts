import { Injectable } from '@nestjs/common';
import { CaptchaService } from 'apps/onboarding/src/gateway/captcha/captcha.service';
import { Rule } from 'apps/onboarding/src/gateway/rule';

@Injectable()
export class CaptchaRule implements Rule<unknown, unknown> {
  constructor(private captchaService: CaptchaService) {
  }
  getID() {
    return "CaptchaRule"
  }

  async verify(req, config, context) {
    const input = {} // extract from req
    return this.captchaService.verifyCaptcha(input)
  }
}
