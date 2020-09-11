import { registerAs } from '@nestjs/config'

export enum Networks {
  integration = 'integration',
  alfajoresstaging = 'alfajoresstaging',
  alfajores = 'alfajores',
  mainnet = 'mainnet',
}
const fornoStaging = 'https://alfajoresstaging-forno.celo-testnet.org'
const odisUrlStaging = 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
const odisPubKeyStaging = '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA'

const fornoAlfajores = 'https://alfajores-forno.celo-testnet.org'
const odisUrlAlfajores = 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
const odisPubKeyAlfajores = 'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA'

const fornoMainnet = 'https://rc1-forno.celo-testnet.org'
const odisUrlMainnet = 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net'
const odisPubKeyMainnet = 'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA'

export interface NetworkConfig {
  fullNodeUrl: string
  odisPubKey: string
  odisUrl: string
}

export interface AppConfig {
  host: string
  port: number
  log_level: string
  address: string
  azureVaultName: string
  networkConfig: NetworkConfig
}

const networkConfigs: { [testnet: string]: NetworkConfig } = {
  [Networks.integration]: {
    fullNodeUrl: fornoStaging,
    odisPubKey: odisPubKeyStaging,
    odisUrl: odisUrlStaging
  },
  [Networks.alfajoresstaging]: {
    fullNodeUrl: fornoStaging,
    odisPubKey: odisPubKeyStaging,
    odisUrl: odisUrlStaging
  },
  [Networks.alfajores]: {
    fullNodeUrl: fornoAlfajores,
    odisPubKey: odisPubKeyAlfajores,
    odisUrl: odisUrlAlfajores
  },
  [Networks.mainnet]: {
    fullNodeUrl: fornoMainnet,
    odisPubKey: odisPubKeyMainnet,
    odisUrl: odisUrlMainnet
  }
}

export default registerAs<() => AppConfig>('app', () => ({
  host: process.env.RELAYER_HOST || "0.0.0.0",
  port: parseInt(process.env.RELAYER_PORT, 10) || 3000,
  log_level: process.env.LOG_LEVEL || 'debug',
  address: process.env.ADDRESS,
  azureVaultName: process.env.AZUREVAULTNAME,
  networkConfig: networkConfigs[process.env.NETWORK]
}))
