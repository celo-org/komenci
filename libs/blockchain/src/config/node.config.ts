import { ConfigType, registerAs } from '@nestjs/config';

export enum NodeProviderType {
  IPC = "ipc",
  HTTP = "http",
  WS = "ws",
}

export const nodeConfig = registerAs('node', () => {
  return {
    providerType: process.env.NODE_PROVIDER_TYPE as NodeProviderType,
    url: process.env.NODE_URL
  }
})

export type NodeConfig = ConfigType<typeof nodeConfig>
