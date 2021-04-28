import { RulesConfig } from '../../config/rules.config'
import { Err, Ok } from '@celo/base/lib/result'
import { Injectable } from '@nestjs/common'
import { StartSessionDto } from '../../dto/StartSessionDto'
import {
  CaptchaService,
  CaptchaServiceErrors
} from '../captcha/captcha.service'
import { GatewayContext, Rule, RuleID } from './rule'

export type CaptchaRuleConfig = RulesConfig["configs"][RuleID.Captcha]

@Injectable()
export class CaptchaRule implements Rule<CaptchaRuleConfig, CaptchaServiceErrors> {
  constructor(private captchaService: CaptchaService) {}

  getID() {
    return RuleID.Captcha
  }

  async verify(
    payload: Pick<StartSessionDto, 'captchaResponseToken'>,
    config: CaptchaRuleConfig,
    context: GatewayContext
  ) {
    if (config.bypassEnabled && payload.captchaResponseToken === config.bypassToken) {
      return Ok(true)
    }
    const result = await this.captchaService.verifyCaptcha(
      payload.captchaResponseToken
    )
    if (result.ok) {
      return Ok(true)
    } else if (result.ok === false) {
      return Err(result.error)
    }
  }
}
