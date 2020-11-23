import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.RELAYER_HOST || '0.0.0.0',
    port: parseInt(process.env.RELAYER_PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',
    transactionCheckIntervalMs: parseInt(process.env.TRANSACTION_CHECK_INTERVAL_MS, 10) || 1000,
    transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 20000,
    transactionMaxGas: parseInt(process.env.TRANSACTION_MAX_GAS, 10) || 1000000,
    version: process.env.KOMENCI_VERSION || 'version-missing',
    service: process.env.KOMENCI_SERVICE || 'komenci-relayer'
  }
})

export type AppConfig = ConfigType<typeof appConfig>
