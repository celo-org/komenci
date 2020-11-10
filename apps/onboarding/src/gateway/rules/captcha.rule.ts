import { Err, Ok } from '@celo/base/lib/result'
import { Injectable } from '@nestjs/common'
import { isRight } from 'fp-ts/Either'
import * as t from 'io-ts'
import { StartSessionDto } from '../../dto/StartSessionDto'
import {
  CaptchaService,
  CaptchaServiceErrors
} from '../captcha/captcha.service'
import { GatewayContext, Rule, RuleID } from './rule'

const CaptchaRuleConfig = t.type({
  bypassEnabled: t.boolean,
  bypassToken: t.string
})

type CaptchaRuleConfig = t.TypeOf<typeof CaptchaRuleConfig>

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

  validateConfig(configString: string): CaptchaRuleConfig | undefined {
    // XXX: I want to refactor some stuff here to make
    // this better but I didn't wanna do a huge refactor
    // just for this
    let rawConfig
    try {
      rawConfig = JSON.parse(configString)
    } catch (e) {
      return undefined
    }

    const decoded = CaptchaRuleConfig.decode(rawConfig)
    if (isRight(decoded)) {
      return decoded.right
    } else {
      return undefined
    }
  }

  defaultConfig(): CaptchaRuleConfig {
    return {
      bypassEnabled: false,
      bypassToken: ""
    }
  }
}
