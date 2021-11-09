import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt_secret: process.env.JWT_SECRET || 'secret123456789',
  log_level: process.env.LOG_LEVEL || 'debug',
  transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 10000,
  // This feature should be enabled at a later date after we deploy a
  // new version of Attestations.sol
  useAttestationGuards: process.env.USE_ATTESTATION_GUARDS === 'true',
  relayerRpcTimeoutMs: parseInt(process.env.RELAYER_RPC_TIMEOUT_MS, 10) || 5000,
  callbackUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  version: process.env.KOMENCI_VERSION || 'version-missing',
  service: process.env.KOMENCI_SERVICE || 'komenci-api',
  fornoApiKey: process.env.FORNO_API_KEY,
}))

export type AppConfig = ConfigType<typeof appConfig>
