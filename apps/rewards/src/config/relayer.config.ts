import { registerAs } from '@nestjs/config'
import { TcpClientOptions, Transport } from '@nestjs/microservices'

export const relayerConfig = registerAs<() => TcpClientOptions>('relayer', () => ({
  transport: Transport.TCP,
  options: {
    host: process.env.RELAYER_HOST,
    port: parseInt(process.env.RELAYER_PORT, 10)
  }
}))

export type RelayerConfig = TcpClientOptions
