import { Injectable, OnModuleInit, Inject } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ModuleRef } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { StartSessionDto } from '../dto/StartSessionDto'
import { CaptchaRule } from './rules/captcha.rule'
import { DailyCapRule } from './rules/daily-cap.rule'
import { DeviceAttestationRule } from './rules/device-attestation.rule'
import { GatewayContext, Rule } from './rules/rule'
import rulesConfig from '../config/rules.config'

@Injectable()
export class GatewayService implements OnModuleInit {
  private rules: Array<Rule<any, any>>
  private ruleEnabled: Record<string, boolean>
  // TODO: Better types here
  private ruleConfigs: Record<string, unknown>

  constructor(
    @Inject(rulesConfig.KEY)
    private config: ConfigType<typeof rulesConfig>,
    private moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    this.rules = await Promise.all([
      this.moduleRef.create(DailyCapRule),
      this.moduleRef.create(CaptchaRule),
      this.moduleRef.create(DeviceAttestationRule)
    ])


    // TODO: These should be initialized from Redis
    this.ruleEnabled = this.config.enabled

    this.ruleConfigs = this.rules.reduce((acc, rule) => {
      return {
        ...acc,
        [rule.getID()]: this.config.configs[rule.getID()] || rule.defaultConfig()
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

    return results.every(result => result.ok)
  }
}
