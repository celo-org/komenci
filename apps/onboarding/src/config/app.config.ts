import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT, 10) || 3000,
  log_level: process.env.LOG_LEVEL || 'debug'
}))

