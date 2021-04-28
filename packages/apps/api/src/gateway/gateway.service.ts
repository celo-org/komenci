import { FastifyRequest } from 'fastify'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { RootError } from '@celo/base/lib/result'
import { EventType, KomenciLoggerService } from '@komenci/logger'
import { rulesConfig } from '../config/rules.config'
import { StartSessionDto } from '../dto/StartSessionDto'
import { CaptchaRule } from './rules/captcha.rule'
import { DailyCapRule } from './rules/daily-cap.rule'
import { DeviceAttestationRule } from './rules/device-attestation.rule'
import { Rule } from './rules/rule'
import { SignatureRule } from './rules/signature.rule'

@Injectable()
export class GatewayService implements OnModuleInit {
  private rules: Array<Rule<any, RootError<any>>>

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
  }

  async verify(
    startSessionDto: StartSessionDto,
    req: FastifyRequest
  ): Promise<boolean> {
    const enabledRules = this.rules.filter(
      rule => this.config.enabled[rule.getID()]
    )

    const context = { req } // must build context
    const results = await Promise.all(
      enabledRules.map(rule => {
        return rule.verify(
          startSessionDto,
          this.config.configs[rule.getID()],
          context
        )
      })
    )

    let hasFailingResult = false
    results.forEach((result, idx) => {
      this.logger.event(EventType.RuleVerified, {
        ruleId: enabledRules[idx].getID(),
        externalAccount: startSessionDto.externalAccount,
        result: result.ok
      })

      if (result.ok === false) {
        hasFailingResult = true
        this.logger.error(result.error)
      }
    })

    return !hasFailingResult
  }
}
