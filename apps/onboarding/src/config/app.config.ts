import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt_secret: process.env.JWT_SECRET || 'secret123456789',
  log_level: process.env.LOG_LEVEL || 'debug',
  mtwDeployerAddress: process.env.MTW_DEPLOYER_ADDRESS,
  mtwImplementationAddress: process.env.MTW_IMPLEMENTATION_ADDRESS,
  fundAddress: process.env.FUND_ADDRESS,
  transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 10000,
  // This feature should be enabled at a later date after we deploy a
  // new version of Attestations.sol
  useAttestationGuards: process.env.USE_ATTESTATION_GUARDS === 'true'
}))

export type AppConfig = ConfigType<typeof appConfig>
