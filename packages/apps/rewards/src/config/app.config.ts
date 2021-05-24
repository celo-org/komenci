import { ConfigType, registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt_secret: process.env.JWT_SECRET || 'secret123456789',
  log_level: process.env.LOG_LEVEL || 'debug',
  service: process.env.KOMENCI_SERVICE || 'komenci-rewards',
  version: process.env.KOMENCI_VERSION || 'version-missing',
  relayerRpcTimeoutMs: parseInt(process.env.RELAYER_RPC_TIMEOUT_MS, 10) || 5000,
  inviteRewardAmountInCusd:
    parseInt(process.env.INVITE_REWARD_AMOUNT_IN_CUSD, 10) || 0.001,
  segmentApiKey: process.env.SEGMENT_API_KEY,
  shouldSendRewards: process.env.SHOULD_SEND_REWARDS || false,
}))

export type AppConfig = ConfigType<typeof appConfig>
