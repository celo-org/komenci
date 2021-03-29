import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.RELAYER_HOST || '0.0.0.0',
    port: parseInt(process.env.RELAYER_PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',
    transactionCheckIntervalMs: parseInt(process.env.TRANSACTION_CHECK_INTERVAL_MS, 10) || 3000,
    transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 23000,
    transactionMaxGas: parseInt(process.env.TRANSACTION_MAX_GAS, 10) || 1000000,
    version: process.env.KOMENCI_VERSION || 'version-missing',
    service: process.env.KOMENCI_SERVICE || 'komenci-relayer',
    gasPriceUpdateIntervalMs: parseInt(process.env.GAS_PRICE_UPDATE_INTERVAL_MS, 10) || 30000, // 30s
    gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 5,
    gasPriceFallback: process.env.GAS_PRICE_FALLBACK || "500000000", // 0.5 Gwei
    maxGasPrice: process.env.MAX_GAS_PRICE || "3000000000", // 3 Gwei
    odisTimeoutMs: parseInt(process.env.ODIS_TIMEOUT_MS, 10) || 10000, // 10s
  }
})

export type AppConfig = ConfigType<typeof appConfig>
