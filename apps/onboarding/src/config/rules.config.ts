import { registerAs } from '@nestjs/config'
import { RuleID } from 'apps/onboarding/src/gateway/rules/rule'

function getConfig(config: string | undefined) {
  try {
    return JSON.parse(config)
  // tslint:disable-next-line
  } catch { }
}

export default registerAs('rules', (): RulesConfig => ({
  enabled: {
    [RuleID.DailyCap]: process.env.RULE_DAILY_CAP_ENABLED === 'true',
    [RuleID.Captcha]: process.env.RULE_CAPTCHA_ENABLED === 'true',
    [RuleID.DeviceAttestation]: process.env.RULE_DEVICE_ATTESTATION_ENABLED === 'true',
  },
  configs: {
    [RuleID.DailyCap]: getConfig(process.env.RULE_DAILY_CAP_CONFIG),
    [RuleID.Captcha]: getConfig(process.env.RULE_CAPTCHA_CONFIG),
    [RuleID.DeviceAttestation]: getConfig(process.env.RULE_DEVICE_ATTESTATION_CONFIG),
  },
}))

export interface RulesConfig {
  enabled: Partial<Record<RuleID, boolean>>,
  configs: Partial<Record<RuleID, any>>
}
