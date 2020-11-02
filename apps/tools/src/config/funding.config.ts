import { Address } from '@celo/base'
import { ConfigType, registerAs } from '@nestjs/config'
const networkConfig: Record<Network, NetworkConfig> = require('../../../../network-config')

export enum Network {
  Alfajores = 'alfajores',
  AlfajoresStaging = 'alfajoresstaging',
  Baklava = 'baklava',
  BaklavaStaging = 'baklavastaging',
  RC1 = 'rc1'
}

interface NetworkConfig {
  relayers: Address[]
  metaTransactionWalletDeployer: Address
  metaTransactionWalletImplementations: Record<Address, string>
  fornoURL: string
  fundMnemonic: string
}


export const fundingConfig = registerAs('funding', () => {
  const network = Network[process.env.NETWORK] as Network
  if (!network) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }
  return networkConfig[network]
})

export type FundingConfig = ConfigType<typeof fundingConfig>
