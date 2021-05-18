import { floatFromEnv, listFromEnv } from '@komenci/core/dist/env'
import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.FUNDER_HOST || '0.0.0.0',
    port: parseInt(process.env.FUNDER_PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',
    relayersToWatch: listFromEnv(process.env.RELAYERS_TO_WATCH),
    // Balance threshold for initiating a top-up
    topupThreshold: {
      cUSD: floatFromEnv(process.env.CUSD_TOPUP_THRESHOLD, 50),
      celo: floatFromEnv(process.env.CELO_TOPUP_THRESHOLD, 10),
    },
    topupMaxAmount: {
      cUSD: floatFromEnv(process.env.CUSD_TOPUP_MAX_AMOUNT, 200),
      celo: floatFromEnv(process.env.CELO_TOPUP_MAX_AMOUNT, 20),
    }
  }
})


export type AppConfig = ConfigType<typeof appConfig>
