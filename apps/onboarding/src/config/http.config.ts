import { registerAs } from '@nestjs/config';

export interface HttpConfig {
  port: number
  host: string
}

export default registerAs<() => HttpConfig>('http', () => ({
  host: process.env.HOST || '0.0.0.0',
  port: ((): number => {
    if (!!process.env.PORT) {
      return parseInt(process.env.PORT)
    } else {
      return 3000
    }
  })()
}))

