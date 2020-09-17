import { Err, Ok } from '@celo/base/lib/result'
import { Injectable } from '@nestjs/common'
import { ErrorCode } from 'apps/onboarding/src/gateway/captcha/ReCAPTCHAResponseDto'
import { StartSessionDto } from '../../dto/StartSessionDto'
import { HttpErrorTypes } from '../../errors/http'
import {
  CaptchaService,
  CaptchaServiceErrors,
  ReCAPTCHAErrorTypes
} from '../captcha/captcha.service'
import { Rule } from './rule'

@Injectable()
export class CaptchaRule implements Rule<unknown, CaptchaServiceErrors> {
  constructor(private captchaService: CaptchaService) {}

  getID() {
    return 'CaptchaRule'
  }

  async verify(
    payload: Pick<StartSessionDto, 'captchaResponseToken'>,
    config,
    context
  ) {
    const result = await this.captchaService.verifyCaptcha(
      payload.captchaResponseToken
    )
    if (result.ok) {
      return Ok(true)
    } else if (result.ok === false) {
      return Err(result.error)
    }
  }

  validateConfig(config: unknown): unknown {
    return config
  }

  defaultConfig(): unknown {
    return null
  }
}
