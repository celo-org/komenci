import { registerAs } from '@nestjs/config'
import { RuleID } from 'apps/onboarding/src/gateway/rules/rule'

export default registerAs('rules', (): RulesConfig => ({
  enabled: {
    [RuleID.DailyCap]: process.env.RULE_DAILY_CAP_ENABLED === 'true',
    [RuleID.Captcha]: process.env.RULE_CAPTCHA_ENABLED === 'true',
    [RuleID.DeviceAttestation]: process.env.RULE_DEVICE_ATTESTATION_ENABLED === 'true',
  },
  configs: {
    DAILY_CAP: process.env.RULE_DAILY_CAP_CONFIG,
    CAPTCHA: process.env.RULE_CAPTCHA_CONFIG,
    DEVICE_ATTESTATION: process.env.RULE_DEVICE_ATTESTATION_CONFIG,
  },
}))

export interface RulesConfig {
  enabled: Partial<Record<RuleID, boolean>>,
  configs: Partial<Record<RuleID, any>>
}
