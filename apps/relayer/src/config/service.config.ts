import { registerAs } from '@nestjs/config';

export interface ServiceConfig {
  host: string
  port: number
}

export default registerAs<() => ServiceConfig>('service', () => ({
  host: process.env.HOST || "0.0.0.0",
  port: ((): number => {
    if (!!process.env.PORT) {
      return parseInt(process.env.PORT)
    } else {
      return 3000
    }
  })()
}))

