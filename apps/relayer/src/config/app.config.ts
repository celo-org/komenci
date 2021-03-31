import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => {
  return {
    host: process.env.RELAYER_HOST || '0.0.0.0',
    port: parseInt(process.env.RELAYER_PORT, 10) || 3000,
    logLevel: process.env.LOG_LEVEL || 'debug',
    transactionCheckIntervalMs: parseInt(process.env.TRANSACTION_CHECK_INTERVAL_MS, 10) || 3000,
    transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 60000,
    transactionMaxGas: parseInt(process.env.TRANSACTION_MAX_GAS, 10) || 1000000,
    version: process.env.KOMENCI_VERSION || 'version-missing',
    service: process.env.KOMENCI_SERVICE || 'komenci-relayer',
    gasPriceUpdateIntervalMs: parseInt(process.env.GAS_PRICE_UPDATE_INTERVAL_MS, 10) || 5000, // 5s
    gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 5,
    gasPriceFallback: process.env.GAS_PRICE_FALLBACK || "1000000000", // 1 Gwei
    maxGasPrice: process.env.MAX_GAS_PRICE || "100000000000", // 50 Gwei
    odisTimeoutMs: parseInt(process.env.ODIS_TIMEOUT_MS, 10) || 10000, // 10s
  }
})

export type AppConfig = ConfigType<typeof appConfig>
