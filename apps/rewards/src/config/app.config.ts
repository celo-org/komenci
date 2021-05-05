import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt_secret: process.env.JWT_SECRET || 'secret123456789',
  log_level: process.env.LOG_LEVEL || 'debug',
  transactionTimeoutMs:
    parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 60000,
  inviteRewardAmountInCusd:
    parseInt(process.env.INVITE_REWARD_AMOUNT_IN_CUSD, 10) || 1
}))

export type AppConfig = ConfigType<typeof appConfig>
