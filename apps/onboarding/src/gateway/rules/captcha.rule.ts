import { Injectable } from '@nestjs/common';
import { HttpErrorTypes } from '../../errors/http';
import { StartSessionDto } from '../../dto/StartSessionDto';
import { CaptchaService, ReCAPTCHAErrorTypes } from '../captcha/captcha.service';
import { Rule, Passed, Failed } from './rule';


@Injectable()
export class CaptchaRule implements Rule<unknown, string> {
  constructor(private captchaService: CaptchaService) {
  }

  getID() {
    return "CaptchaRule"
  }

  async verify(startSessionDto: StartSessionDto, config, context) {
    const result = await this.captchaService.verifyCaptcha({
      token: startSessionDto.captchaResponse
    })
    if (result.ok) {
      return Passed()
    } else if (result.ok === false) {
      const { error } = result
      if (error.errorType == HttpErrorTypes.RequestError) {
        return Failed("http-error")
      } else if (error.errorType == ReCAPTCHAErrorTypes.VerificationFailed) {
        return Failed(...error.errorCodes)
      } else {
        return Failed("unexpected-error")
      }
    }
  }

  validateConfig(config: unknown): unknown {
    return config
  }

  defaultConfig(): unknown {
    return null
  }
}
