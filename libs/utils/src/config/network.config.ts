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
      },
      {
        externalAccount: "0x0f812be74511b90ea6b2f80e77bea047e69a0b2a",
        metaTransactionWallet: "0x41f7cDa0367A6C3739dA2958681FF90f7E499b06"
      },
      {
        externalAccount: "0xb354d3d2908ba6a2b791683b0f454a38f69cb282",
        metaTransactionWallet: "0xE329d3103EF8D8f3D376Ab9A86De3e51b5439f40"
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x88a2b9B8387A1823D821E406b4e951337fa1D46D": "1.1.0.0-p1",
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.1.0.0-p2",
        "0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A": "1.1.0.0-p3"
      },
      MetaTransactionWalletDeployer: "0x64Ab4DD46511cAFC7238A701b0b21C4F1cd4Ac4b"
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
        externalAccount: "0x21888ae301658cdff7ce8c33cdf83a330a5e6273",
        metaTransactionWallet: "0xD787384d91a7fFaC85d51C63EF71580df6C677B7",
      },
      {
        externalAccount: "0x1438128a2dcc645f0b9706350c1f5dad04845fe6",
        metaTransactionWallet: "0xC90CC3A0D10aA1F827fAD4eC39DfE2Aa78cF07bB",
      },
      {
        externalAccount: "0x1e36bf42272a0693eba69332a6f623ce37694a27",
        metaTransactionWallet: "0x582C91AD7bdAE0c48739d0eb5A753Ed715e649C8",
      },
      {
        externalAccount: "0xd5afaaa7256c9eb86376c4214635dd56dffbd3a8",
        metaTransactionWallet: "0x7885c25834aAA32B86be10BF3C6ed766a1f3D79A",
      },
      {
        externalAccount: "0xb09eba8bc1c8bedadd634a8219c0b09042170903",
        metaTransactionWallet: "0x63e1fcB88713aAEA8bD88Fc968c12403AB3F796F",
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x63004Acf0Ace666651E191ad17BC8D85077A09e6": "1.1.0.0-p1",
        "0x6511FB5DBfe95859d8759AdAd5503D656E2555d7": "1.1.0.0-p2"
      },
      MetaTransactionWalletDeployer: "0xbDb92Ca42559adc5adC20a1E4985dC7c476483be"
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

