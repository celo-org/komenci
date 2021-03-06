import { privateKeyToAddress } from '@celo/utils/lib/address'
import { WalletConfig, WalletType } from '@komenci/blockchain/dist/config/wallet.config'
import mnemonics from '@komenci/blockchain/dist/truffle-deployer-config'
import { Network } from '@komenci/core'
import { registerAs } from '@nestjs/config'
import * as bip32 from 'bip32'
import * as bip39 from 'bip39'


export const generatePrivateKeyWithDerivations = (mnemonic: string, derivations: number[]) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = derivations.reduce((n: bip32.BIP32Interface, derivation: number) => {
    return n.derive(derivation)
  }, node)
  return newNode.privateKey!.toString('hex')
}

const buildFundConfig = (mnemonic): WalletConfig => {
  const privateKey = generatePrivateKeyWithDerivations(mnemonic ,[0,0])
  const address = privateKeyToAddress(privateKey)
  return {
    type: WalletType.Local,
    privateKey,
    address
  }
}

export const fundConfig = registerAs<() => WalletConfig>('fund', () => {
  const network = Network[process.env.NETWORK] as Network
  if (!network) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }

  if (network === Network.rc1) {
    // For RC1 use HSM
    return {
      type: WalletType.AzureHSM,
      address: process.env.FUND_ADDRESS,
      vaultName: process.env.AZURE_VAULT_NAME,
      keyName: process.env.AZURE_KEY_NAME
    }
  }

  if (mnemonics[network] === undefined) {
    throw Error(`No mnemonic found for ${network}, check truffler-deployer-config`)
  }

  return buildFundConfig(mnemonics[network])
})
