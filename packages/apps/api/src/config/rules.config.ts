import { registerAs } from '@nestjs/config'
import { RuleID } from '../gateway/rules/rule'

const isTrue = (content: string) => String(content).toLowerCase() === 'true'

export interface RulesConfig {
  enabled: Partial<Record<RuleID, boolean>>,
  configs: Partial<{
    [RuleID.Captcha]: {
      bypassEnabled: boolean,
      bypassToken: string
    }
    [RuleID.DailyCap]: null,
    [RuleID.DeviceAttestation]: null,
    [RuleID.Signature]: null,
  }>
}

export const rulesConfig = registerAs('rules', (): RulesConfig => ({
  enabled: {
    [RuleID.DailyCap]: isTrue(process.env.RULE_DAILY_CAP_ENABLED),
    [RuleID.Captcha]: isTrue(process.env.RULE_CAPTCHA_ENABLED),
    [RuleID.DeviceAttestation]: isTrue(process.env.RULE_DEVICE_ATTESTATION_ENABLED),
    [RuleID.Signature]: isTrue(process.env.RULE_SIGNATURE_ENABLED),
  },
  configs: {
    [RuleID.DailyCap]: null,
    [RuleID.Captcha]: {
      bypassEnabled: isTrue(process.env.RULE_CAPTCHA_CONFIG_BYPASS_ENABLED),
      bypassToken: process.env.RULE_CAPTCHA_CONFIG_BYPASS_TOKEN || ""
    },
    [RuleID.DeviceAttestation]: null,
    [RuleID.Signature]: null,
  },
}))

