import { Address } from '@celo/base'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { registerAs } from '@nestjs/config'

import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
const networkConfigs: Record<Network, NetworkConfig> = require('../../../../network-config')

export enum Network {
  alfajores = 'alfajores',
  alfajoresstaging = 'alfajoresstaging',
  baklava = 'baklava',
  baklavastaging = 'baklavastaging',
  rC1 = 'rc1'
}

export interface RelayerConfig {
  externalAccount: Address,
  metaTransactionWallet: Address
}

export interface NetworkConfig {
  relayers: RelayerConfig[]
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

export const generatePrivateKeyWithDerivations = (mnemonic: string, derivations: number[]) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = derivations.reduce((n: bip32.BIP32Interface, derivation: number) => {
    return n.derive(derivation)
  }, node)
  return newNode.privateKey!.toString('hex')
}

const buildFundConfig = (mnemonic) => {
  try {
    const privateKey = generatePrivateKeyWithDerivations(mnemonic ,[0,0])
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
  if (!networkConfigs[network]) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }

  return {
    ...networkConfigs[network],
    fund: buildFundConfig(networkConfigs[network].fund.mnemonic)
  }
})

