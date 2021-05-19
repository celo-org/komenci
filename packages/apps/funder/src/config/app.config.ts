import { floatFromEnv, intFromEnv, listFromEnv } from '@komenci/core/dist/env'
import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.FUNDER_HOST || '0.0.0.0',
    port: intFromEnv("FUNDER_PORT", 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    addressesToWatch: listFromEnv("ADDRESSES_TO_WATCH"),
    token: process.env.TOKEN_ADDRESS,
    balanceThreshold: floatFromEnv("BALANCE_THRESHOLD"),
    topupAmount: floatFromEnv("TOPUP_AMOUNT"),
  }
})


export type AppConfig = ConfigType<typeof appConfig>
