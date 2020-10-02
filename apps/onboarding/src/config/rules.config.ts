import { registerAs } from '@nestjs/config'
import { RuleID } from 'apps/onboarding/src/gateway/rules/rule'

const isTrue = (content: string) => String(content).toLowerCase() === 'true'

export const rulesConfig = registerAs('rules', (): RulesConfig => ({
  enabled: {
    [RuleID.DailyCap]: isTrue(process.env.RULE_DAILY_CAP_ENABLED),
    [RuleID.Captcha]: isTrue(process.env.RULE_CAPTCHA_ENABLED),
    [RuleID.DeviceAttestation]: isTrue(process.env.RULE_DEVICE_ATTESTATION_ENABLED),
  },
  configs: {
    [RuleID.DailyCap]: process.env.RULE_DAILY_CAP_CONFIG,
    [RuleID.Captcha]: process.env.RULE_CAPTCHA_CONFIG,
    [RuleID.DeviceAttestation]: process.env.RULE_DEVICE_ATTESTATION_CONFIG,
  },
}))

export interface RulesConfig {
  enabled: Partial<Record<RuleID, boolean>>,
  configs: Partial<Record<RuleID, any>>
}
