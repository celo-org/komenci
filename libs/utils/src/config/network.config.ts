import { Address } from '@celo/base'
import { registerAs } from '@nestjs/config'

const fornoURLForEnv = (env) => "https://"+env+"-forno.celo-testnet.org"

export enum Network {
  alfajores = 'alfajores',
  alfajoresstaging = 'alfajoresstaging',
  baklava = 'baklava',
  baklavastaging = 'baklavastaging',
  rc1 = 'rc1'
}

export interface RelayerAccounts {
  externalAccount: Address,
  metaTransactionWallet: Address
}

export interface NetworkConfig {
  relayers: RelayerAccounts[]
  contracts: {
    MetaTransactionWalletDeployer: Address
    MetaTransactionWalletVersions: Record<Address, string>
  },
  fornoURL: string
  odis: {
    publicKey: string
    url: string
  },
}

const configs: Record<Network, NetworkConfig> = {
  [Network.alfajores]: {
    relayers: [
      {
        externalAccount: "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47",
        metaTransactionWallet: "0xcb361f5852eefdd5ddfc593924405c86c79840b2"
      },
      {
        externalAccount: "0x00454cac6dae53f8800f71395b9a174f07a784b1",
        metaTransactionWallet: "0x56ccb8e62b2a751df7c0298281845df155ba8539"
      },
      {
        externalAccount: "0xc6f0f9bfb1aed83620ece3eac0add98a65a8574e",
        metaTransactionWallet: "0xdd648cae0302acd1da9114518b8f52732a10e47c"
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x88a2b9B8387A1823D821E406b4e951337fa1D46D": "1.1.0.0-p1",
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.1.0.0-p2"
      },
      MetaTransactionWalletDeployer: "0xb1Feb55F2BF2eCfb32CF8E09ce397Acf54414A45"
    },
    fornoURL: fornoURLForEnv('alfajores'),
    odis: {
      publicKey: 'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
      url: 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
    }
  },

  [Network.alfajoresstaging]: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x5ee40856c2a73e08B645044B6B8466310640DA9E"
    },
    fornoURL: fornoURLForEnv('alfajoresstaging'),
    odis: {
      publicKey: '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
      url: 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
    }
  },

  [Network.baklava]: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x0": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x0",
    },
    fornoURL: fornoURLForEnv('baklava'),
    odis: {
      publicKey: "",
      url: ""
    }
  },

  [Network.baklavastaging]: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x0": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x0",
    },
    fornoURL: fornoURLForEnv('baklavastaging'),
    odis: {
      publicKey: "",
      url: ""
    }
  },

  [Network.rc1]: {
    relayers: [
      {
        externalAccount: "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47",
        metaTransactionWallet: "2b239845e2b5ae12846e723717e84ebf33af4f88",
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x63004Acf0Ace666651E191ad17BC8D85077A09e6": "1.1.0.0"
      },
      MetaTransactionWalletDeployer: "0x82908811f5fa74cfdA29E325af02fF046B8947aF"
    },
    fornoURL: fornoURLForEnv('rc1'),
    odis: {
      publicKey: 'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
      url: 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net'
    }
  },
}



export const networkConfig = registerAs('network', () => {
  const network = Network[process.env.NETWORK] as Network
  if (!configs[network]) {
    throw Error(`Unknown network: ${process.env.NETWORK}`)
  }

  return {
    ...configs[network],
  }
})

