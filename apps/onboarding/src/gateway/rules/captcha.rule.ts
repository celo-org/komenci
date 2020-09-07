import { Injectable } from '@nestjs/common';
import { CaptchaService } from 'apps/onboarding/src/gateway/captcha/captcha.service';
import { Rule } from 'apps/onboarding/src/gateway/rules/rule';

@Injectable()
export class CaptchaRule implements Rule<unknown, unknown> {
  constructor(private captchaService: CaptchaService) {
  }
  getID() {
    return "CaptchaRule"
  }

  async verify(req, config, context) {
    const input = {
      token: req.body['g-recaptcha-response'],
    }
    return this.captchaService.verifyCaptcha(input)
  }

  validateConfig(config: unknown): unknown {
    return config
  }

  defaultConfig(): unknown {
    return null
  }
}