import { Address } from '@celo/base'
import { ConfigType, registerAs } from '@nestjs/config'
const networkConfigs: Record<Network, NetworkConfig> = require('../../../../network-config')

export enum Network {
  alfajores = 'alfajores',
  alfajoresstaging = 'alfajoresstaging',
  baklava = 'baklava',
  baklavastaging = 'baklavastaging',
  rc1 = 'rc1'
}

export interface NetworkConfig {
  relayers: Address[]
  contracts: {
    MetaTransactionWalletDeployer: Address
    MetaTransactionWalletVersions: Record<Address, string>
  },
  fornoURL: string
  fundMnemonic: string
  odis: {
    publicKey: string
    url: string
  }
}


export const networkConfig = registerAs('network', () => {
  const network = Network[process.env.NETWORK] as Network
  if (!networkConfigs[network]) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }
  return networkConfigs[network]
})

