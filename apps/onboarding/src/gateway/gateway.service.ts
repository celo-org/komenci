import { EventType, KomenciLoggerService } from '@app/komenci-logger'
import { SignatureRule } from '@app/onboarding/gateway/rules/signature.rule'
import { RootError } from '@celo/base/lib/result'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { rulesConfig } from '../config/rules.config'
import { StartSessionDto } from '../dto/StartSessionDto'
import { CaptchaRule } from './rules/captcha.rule'
import { DailyCapRule } from './rules/daily-cap.rule'
import { DeviceAttestationRule } from './rules/device-attestation.rule'
import { Rule } from './rules/rule'

@Injectable()
export class GatewayService implements OnModuleInit {
  private rules: Array<Rule<any, RootError<any>>>
  private ruleEnabled: Record<string, boolean>
  // TODO: Better types here
  private ruleConfigs: Record<string, unknown>

  constructor(
    @Inject(rulesConfig.KEY)
    private config: ConfigType<typeof rulesConfig>,
    private moduleRef: ModuleRef,
    private logger: KomenciLoggerService
  ) {}

  async onModuleInit() {
    this.rules = await Promise.all([
      this.moduleRef.create(DailyCapRule),
      this.moduleRef.create(CaptchaRule),
      this.moduleRef.create(DeviceAttestationRule),
      this.moduleRef.create(SignatureRule)
    ])

    this.ruleEnabled = this.config.enabled
    this.ruleConfigs = this.rules.reduce((acc, rule) => {
      return {
        ...acc,
        [rule.getID()]:
          rule.validateConfig(this.config.configs[rule.getID()]) ||
          rule.defaultConfig()
      }
    }, {})
  }

  async verify(
    startSessionDto: StartSessionDto,
    req: FastifyRequest
  ): Promise<boolean> {
    const enabledRules = this.rules.filter(
      rule => this.ruleEnabled[rule.getID()]
    )

    const context = { req } // must build context
    const results = await Promise.all(
      enabledRules.map(rule => {
        return rule.verify(
          startSessionDto,
          this.ruleConfigs[rule.getID()],
          context
        )
      })
    )

    let hasFailingResult = false
    results.forEach((result, idx) => {
      this.logger.event(EventType.RuleVerified, {
        externalAccount: startSessionDto.externalAccount,
        ruleId: enabledRules[idx].getID(),
        result
      })

      if (result.ok === false) {
        hasFailingResult = true
        this.logger.error(result.error)
      }
    })

    return !hasFailingResult
  }
}
