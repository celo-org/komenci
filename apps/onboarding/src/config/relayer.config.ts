import { registerAs } from '@nestjs/config';
import { TcpClientOptions, Transport } from '@nestjs/microservices';

export default registerAs<() => TcpClientOptions>('relayer', () => ({
  transport: Transport.TCP,
  options: {
    host: process.env.RELAYER_HOST,
    port: parseInt(process.env.RELAYER_PORT),
  }
}))

