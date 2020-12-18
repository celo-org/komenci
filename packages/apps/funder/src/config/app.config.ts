import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.FUNDER_HOST || '0.0.0.0',
    port: parseInt(process.env.FUNDER_PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',

    // TODO: Reasonable defaults
    celoThreshold: parseInt(process.env.CELO_THRESHOLD, 10) || 100,
    cUSDThreshold: parseInt(process.env.CUSD_THRESHOLD, 10) || 200,
    celoTopUpAmount: parseInt(process.env.CELO_TOP_UP, 10) || 100,
    cUSDTopUpAmount: parseInt(process.env.CUSD_TOP_UP, 10) || 50,
    fundingInterval: parseInt(process.env.FUNDING_INTERVAL, 10) || (1000 * 60 * 5),
  }
})


export type AppConfig = ConfigType<typeof appConfig>
