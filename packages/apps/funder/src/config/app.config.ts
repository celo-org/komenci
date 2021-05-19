import { floatFromEnv, intFromEnv, listFromEnv } from '@komenci/core/dist/env'
import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.FUNDER_HOST || '0.0.0.0',
    port: intFromEnv("FUNDER_PORT", 3000),
    logLevel: process.env.LOG_LEVEL || 'debug',
    relayersToWatch: listFromEnv("RELAYERS_TO_WATCH"),
    // Balance threshold for initiating a top-up
    topupThreshold: {
      cUSD: floatFromEnv("CUSD_TOPUP_THRESHOLD", 50),
      celo: floatFromEnv("CELO_TOPUP_THRESHOLD", 10),
    },
    topupMaxAmount: {
      cUSD: floatFromEnv("CUSD_TOPUP_MAX_AMOUNT", 200),
      celo: floatFromEnv("CELO_TOPUP_MAX_AMOUNT", 20),
    }
  }
})


export type AppConfig = ConfigType<typeof appConfig>
