import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CaptchaRule } from './rules/captcha.rule';
import { DailyCapRule } from './rules/daily-cap.rule';
import { DeviceAttestationRule } from './rules/device-attestation.rule';
import { GatewayContext, Rule } from './rules/rule';
import { FastifyRequest } from "fastify"

@Injectable()
export class GatewayService implements OnModuleInit {
  private rules: Rule<any, any>[];
  private ruleEnabled: Record<string, boolean>
  // TODO: Better types here
  private ruleConfigs: Record<string, unknown>

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.rules = await Promise.all([
      this.moduleRef.create(DailyCapRule),
      this.moduleRef.create(CaptchaRule),
      this.moduleRef.create(DeviceAttestationRule),
    ]);

    // TODO: These should be initialized from Redis
    this.ruleEnabled = this.rules.reduce((acc, rule) => {
      return {
        ...acc,
        [rule.getID()]: true
      }
    }, {})

    this.ruleConfigs = this.rules.reduce((acc, rule) => {
      return {
        ...acc ,
        [rule.getID()]: rule.defaultConfig()
      }
    }, {})
  }

  async verify(req: FastifyRequest): Promise<boolean> {
    const enabledRules = this.rules.filter(rule => this.ruleEnabled[rule.getID()])
    const context = {todo: 'TODO'} // must build context
    const results = await Promise.all(enabledRules.map(rule => {
      return rule.verify(req, this.ruleConfigs[rule.getID()], context)
    }))

    return results.every(result => result === true)
  }
}
