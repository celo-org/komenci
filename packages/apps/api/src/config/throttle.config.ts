import { ConfigType, registerAs } from '@nestjs/config'
import { numberFromEnv } from './utils'


export const throttleConfig = registerAs('throttle', () => ({
  ttl: numberFromEnv("THROTTLE_TTL", 60),
  limit: numberFromEnv("THROTTLE_LIMIT", 15)
}))

export type ThrottleConfig = ConfigType<typeof throttleConfig>