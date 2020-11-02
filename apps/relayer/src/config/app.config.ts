import { registerAs } from '@nestjs/config'

export interface AppConfig {
  host: string
  port: number
  logLevel: string
  transactionTimeoutMs: number,
  transactionCheckIntervalMs: number
}

export const appConfig = registerAs<() => AppConfig>('app', () => {
  return {
    host: process.env.RELAYER_HOST || '0.0.0.0',
    port: parseInt(process.env.RELAYER_PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',
    transactionCheckIntervalMs: parseInt(process.env.TRANSACTION_CHECK_INTERVAL_MS, 10) || 1000,
    transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 10000,
  }
})
