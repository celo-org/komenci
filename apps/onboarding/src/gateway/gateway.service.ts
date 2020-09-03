import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CaptchaRule } from 'apps/onboarding/src/gateway/rules/captcha.rule';
import { DailyCapRule } from 'apps/onboarding/src/gateway/rules/daily-cap.rule';
import { DeviceAttestationRule } from 'apps/onboarding/src/gateway/rules/device-attestation.rule';
import { GatewayContext, Rule } from 'apps/onboarding/src/gateway/rule';
import { FastifyRequest } from "fastify"

@Injectable()
export class GatewayService implements OnModuleInit {
  private rules: Rule<any, any>[];
  private ruleEnabled: Record<string, boolean>

  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.rules = await Promise.all([
      this.moduleRef.create(DailyCapRule),
      this.moduleRef.create(CaptchaRule),
      this.moduleRef.create(DeviceAttestationRule),
    ]);

    this.ruleEnabled = this.rules.reduce((acc, rule) => ({...acc, [rule.getID()]: true}), {})
  }

  async verify(req: FastifyRequest): Promise<boolean> {
    const enabledRules = this.rules.filter(rule => this.ruleEnabled[rule.getID()])
    const context = {todo: 'TODO'} // must build context
    const results = await Promise.all(enabledRules.map(rule => this.verifyRule(rule, req, context)))
    return results.every(result => result === true)
  }

  async verifyRule(rule: Rule<unknown, unknown>, req: FastifyRequest, context: GatewayContext): Promise<boolean> {
    const config = {}
    return rule.verify(req, config, context)
  }
}
