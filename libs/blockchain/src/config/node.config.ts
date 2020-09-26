import { ConfigType, registerAs } from '@nestjs/config';

export const nodeConfigParser = registerAs('nodeConfig', () => ({
  rpcURL: process.env.NODE_RPC_URL
}))

export type NodeConfig = ConfigType<typeof nodeConfigParser>
