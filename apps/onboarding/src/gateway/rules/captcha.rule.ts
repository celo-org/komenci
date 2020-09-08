import { Injectable } from '@nestjs/common';
import { CaptchaService } from '../captcha/captcha.service';
import { Rule } from './rule';
import { StartSessionDto } from '../../dto/StartSessionDto'

@Injectable()
export class CaptchaRule implements Rule<unknown, unknown> {
  constructor(private captchaService: CaptchaService) {
  }
  getID() {
    return "CaptchaRule"
  }

  async verify(startSessionDto: StartSessionDto, config, context) {
    const input = {
      token: startSessionDto.captchaResponse,
    }
    return (await this.captchaService.verifyCaptcha(input)).success
  }

  validateConfig(config: unknown): unknown {
    return config
  }

  defaultConfig(): unknown {
    return null
  }
}
