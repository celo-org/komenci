import { registerAs } from '@nestjs/config';

export interface AppConfig {
  host: string
  port: number
  log_level: string
}

export default registerAs<() => AppConfig>('app', () => ({
  host: process.env.HOST || "0.0.0.0",
  port: parseInt(process.env.PORT, 10) || 3000,
  log_level: process.env.LOG_LEVEL || 'debug'
}))

