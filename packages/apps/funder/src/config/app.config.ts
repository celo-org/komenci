import { floatFromEnv, intFromEnv, listFromEnv, envVarWithIndex, objectArrayFromEnv } from '@komenci/core/dist/env'
import { ConfigType, registerAs } from '@nestjs/config'

export interface TokenConfig {
  token: string,
  addressesToWatch: string[],
  balanceThreshold: number,
  topupAmount: number,
  cron: string
}

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.FUNDER_HOST || '0.0.0.0',
    port: intFromEnv("FUNDER_PORT", 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    tokens: objectArrayFromEnv<TokenConfig>({
      token: (index: number) => process.env[envVarWithIndex("TOKEN", index)],
      addressesToWatch: (index: number) => listFromEnv(envVarWithIndex("ADDRESSES_TO_WATCH", index)),
      balanceThreshold: (index: number) => floatFromEnv(envVarWithIndex("BALANCE_THRESHOLD", index)),
      topupAmount: (index: number) => floatFromEnv(envVarWithIndex("TOPUP_AMOUNT", index)),
      cron: (index: number) => process.env[envVarWithIndex("CRON", index)]
    }, (index: number) => process.env[envVarWithIndex("TOKEN", index)] !== undefined),
    token: "",
    addressesToWatch: [],
    balanceThreshold: 0,
    topupAmount: 0,
  }
})


export type AppConfig = ConfigType<typeof appConfig>
