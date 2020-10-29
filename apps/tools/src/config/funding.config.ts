import { Address } from '@celo/base'
import { ConfigType, registerAs } from '@nestjs/config'

export enum Network {
  alfajores = 'alfajores',
  baklava = 'baklava',
  mainnet = 'mainnet'
}

interface NetworkConfig {
  relayers: Address[]
  metaTxWalletDeployer: Address
}

const networkConfigs: Record<Network, NetworkConfig> = {
  [Network.alfajores]: {
    relayers: [
      "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47",
    ],
    metaTxWalletDeployer: "0x47b05993C360dEA811ACe7eC725897aCB74AaBA5"
  },
  [Network.baklava]: {
    relayers: [],
    metaTxWalletDeployer: "0x0"
  },
  [Network.mainnet]: {
    relayers: [],
    metaTxWalletDeployer: "0x0"
  }
}

export const fundingConfig = registerAs('funding', () => {
  const network = Network[process.env.NETWORK] as Network
  if (!network) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }
  return {
    network: network,
    ...networkConfigs[network]
  }
})

export type FundingConfig = ConfigType<typeof fundingConfig>
