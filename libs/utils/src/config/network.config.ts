import { Address } from '@celo/base'
import { coerceMnemonicAccountType, generatePrivateKey } from '@celo/celotool/lib/lib/generate_utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { ConfigType, registerAs } from '@nestjs/config'
const networkConfigs: Record<Network, NetworkConfig> = require('../../../../network-config')

export enum Network {
  alfajores = 'alfajores',
  alfajoresstaging = 'alfajoresstaging',
  baklava = 'baklava',
  baklavastaging = 'baklavastaging',
  rC1 = 'rc1'
}

export interface NetworkConfig {
  relayers: Address[]
  contracts: {
    MetaTransactionWalletDeployer: Address
    MetaTransactionWalletVersions: Record<Address, string>
  },
  fornoURL: string
  odis: {
    publicKey: string
    url: string
  },
  fund: {
    mnemonic: string,
    privateKey: string,
    address: string
  }
}

const buildFundConfig = (mnemonic) => {
  try {
    const privateKey = generatePrivateKey(mnemonic, 0, 0)
    const address = privateKeyToAddress(privateKey)
    return { mnemonic, privateKey, address }
  } catch(e) {
    return {
      mnemonic,
      privateKey: "",
      address: ""
    }
  }
}

export const networkConfig = registerAs('network', () => {
  const network = Network[process.env.NETWORK] as Network
  console.log(network)
  console.log(networkConfigs)
  if (networkConfigs[network]) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }
  return {
    ...networkConfigs[network],
    fund: buildFundConfig(networkConfigs[network].fund.mnemonic)
  }
})

