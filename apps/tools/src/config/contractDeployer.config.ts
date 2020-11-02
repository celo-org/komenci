import { Network } from '@app/utils/config/network.config'
import { coerceMnemonicAccountType, generatePrivateKey } from '@celo/celotool/lib/lib/generate_utils'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { ConfigType, registerAs } from '@nestjs/config'
import { config } from 'dotenv'

const getMnemonicForNetwork = (network): string => {
  const envMemonicResult = config({ path: './libs/celo/.env.mnemonic.'+network })
  if (envMemonicResult.error) {
    throw envMemonicResult.error
  } else if (envMemonicResult.parsed) {
    return envMemonicResult.parsed.MNEMONIC
  }
  throw new Error('Could not get mnemonic')
}

const getPrivateKeyForNetwork = (network): string => {
  const mnemonic = getMnemonicForNetwork(network)
  return generatePrivateKey(mnemonic, coerceMnemonicAccountType('tx_node'), 0)
}

export const contractDeployerConfig = registerAs('contractDeployer', () => {
  const network = Network[process.env.NETWORK] as Network
  if (!network) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }

  const privateKey = getPrivateKeyForNetwork(network)

  return {
    address: privateKeyToAddress(privateKey),
    privateKey: getPrivateKeyForNetwork(network)
  }
})

export type ContractDeployerConfig = ConfigType<typeof contractDeployerConfig>
