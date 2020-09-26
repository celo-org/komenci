import { registerAs } from '@nestjs/config'

export enum Network {
  integration = 'integration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  mainnet = 'mainnet'
}
const fornoStaging = 'https://alfajoresstaging-forno.celo-testnet.org'
const odisUrlStaging =
  'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
const odisPubKeyStaging =
  '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA'

const fornoAlfajores = 'https://alfajores-forno.celo-testnet.org'
const odisUrlAlfajores =
  'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
const odisPubKeyAlfajores =
  'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA'

const fornoMainnet = 'https://rc1-forno.celo-testnet.org'
const odisUrlMainnet =
  'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net'
const odisPubKeyMainnet =
  'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA'

export interface NetworkConfig {
  fullNodeUrl: string
  odisPubKey: string
  odisUrl: string
}

const networkConfigs: Record<Network, NetworkConfig> = {
  [Network.integration]: {
    fullNodeUrl: fornoStaging,
    odisPubKey: odisPubKeyStaging,
    odisUrl: odisUrlStaging
  },
  [Network.alfajoresstaging]: {
    fullNodeUrl: fornoStaging,
    odisPubKey: odisPubKeyStaging,
    odisUrl: odisUrlStaging
  },
  [Network.alfajores]: {
    fullNodeUrl: fornoAlfajores,
    odisPubKey: odisPubKeyAlfajores,
    odisUrl: odisUrlAlfajores
  },
  [Network.mainnet]: {
    fullNodeUrl: fornoMainnet,
    odisPubKey: odisPubKeyMainnet,
    odisUrl: odisUrlMainnet
  }
}

export interface AppConfig {
  host: string
  port: number
  log_level: string
  networkConfig: NetworkConfig
  mtwDeployerAddress: string
}

export const appConfig = registerAs<() => AppConfig>('app', () => {
  const network = process.env.NETWORK as Network
  if (!network) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }
  const networkConfig = networkConfigs[network]
  if (!networkConfig) {
    throw Error(`No config for network: ${network}`)
  }

  return {
    host: process.env.RELAYER_HOST || '0.0.0.0',
    port: parseInt(process.env.RELAYER_PORT, 10) || 3000,
    log_level: process.env.LOG_LEVEL || 'debug',
    mtwDeployerAddress: process.env.META_TX_WALLET_DEPLOYER_ADDRESS,
    networkConfig
  }
})
