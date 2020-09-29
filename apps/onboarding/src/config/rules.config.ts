import { registerAs } from '@nestjs/config'

function getConfig(config: string | undefined) {
  try {
    return JSON.parse(config)
  // tslint:disable-next-line
  } catch { }
}

export default registerAs('rules', () => ({
  enabled: {
    DAILY_CAP: process.env.RULE_DAILY_CAP_ENABLED === 'true',
    CAPTCHA: process.env.RULE_CAPTCHA_ENABLED === 'true',
    DEVICE_ATTESTATION: process.env.RULE_DEVICE_ATTESTATION_ENABLED === 'true',
  },
  configs: {
    DAILY_CAP: getConfig(process.env.RULE_DAILY_CAP_CONFIG),
    CAPTCHA: getConfig(process.env.RULE_CAPTCHA_CONFIG),
    DEVICE_ATTESTATION: getConfig(process.env.RULE_DEVICE_ATTESTATION_CONFIG),
  },
}))
