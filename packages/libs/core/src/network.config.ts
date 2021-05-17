import { Address } from '@celo/base'
import { registerAs } from '@nestjs/config'

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
      },
      {
        externalAccount: "0xd7fc8227642bfab9aa927066e5952fece574f0d6",
        metaTransactionWallet: "0x3363D06380d92b60AcFc1429A67B9c5dF1A0cb9d"
      },
      {
        externalAccount: "0xbb5932e6b6a588cd1c6764f50d1fe410e6a2d71e",
        metaTransactionWallet: "0xe3CA53b083D2bDb539282810B25472BFbcB51EBA"
      },
      {
        externalAccount: "0xc934bff63a0db800acdf7061eb5cc03211e7bccf",
        metaTransactionWallet: "0x54faF22d680E1255587aAb48BF00cdae82b61cC4"
      },
      {
        externalAccount: "0x409832bd2d72017f12cfaa3d6dc0103767bb7e7e",
        metaTransactionWallet: "0x8b3013F2A2CD2661a5083b839443aaeA0f4604B8"
      },
      {
        externalAccount: "0x75222b1aed66393fa43c6454000e097363d85c73",
        metaTransactionWallet: "0x7e9C6a7D24aE1260F0993b5BAe09f715d7B196AE"
      },
      {
        externalAccount: "0xefbc10d42f77c778431043bd3a34b283f90f3979",
        metaTransactionWallet: "0x49dd16cF30cF8BED55ef29917E93EfA871983028"
      },
      {
        externalAccount: "0x70b69157973cd31dae5dc68ee1891b9eae379c42",
        metaTransactionWallet: "0x122FdAc181afF98De634cd8686975Ae9A070924e"
      },
      {
        externalAccount: "0x04a444af9a79b6784bcd57c50ba1e051ba536ed4",
        metaTransactionWallet: "0x7D6655c13AAE83329A3507d9F4Ca7Ca4A9eCF2ca"
      },
      {
        externalAccount: "0x5226c3908b0db17ED553aEbC395dC685714453cb",
        metaTransactionWallet: "0x0244d0B64CD8CDD751E026DA5Df31A8c0fdA6Ee1"
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x88a2b9B8387A1823D821E406b4e951337fa1D46D": "1.1.0.0-p1",
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.1.0.0-p2",
        "0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A": "1.1.0.0-p3"
      },
      MetaTransactionWalletDeployer: "0x4cda887Bce324109535814D49b74c6a560fAe1D9"
    },
    fornoURL: 'https://alfajores-forno.celo-testnet.org',
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
    fornoURL: 'https://alfajoresstaging-forno.celo-testnet.org',
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
    fornoURL: 'https://baklava-forno.celo-testnet.org',
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
    fornoURL: 'https://baklavastaging-forno.celo-testnet.org',
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
      },
      {
        externalAccount: "0x85a1e716608a84f455d7e07befb76c9b540ac040",
        metaTransactionWallet: "0xf4453DF9C6fa1b0C00462D901C68cFb5517CBD84",
      },
      {
        externalAccount: "0x2a094e77acf3faebb63279eb60e26d144b9048a2",
        metaTransactionWallet: "0xA555a7561B9440AE118B0a3153B4d4bDFA1cF5C7",
      },
      {
        externalAccount: "0x2f23f9a8f68294a9d6b479c3dbe3dff4de510ced",
        metaTransactionWallet: "0x3d8730341E2eD43B4b5A10252E3A90f1DCDe555f",
      },
      {
        externalAccount: "0x3db3150c1267d3adeb7f960f3eef11c1dd47a38b",
        metaTransactionWallet: "0x7941A0096e98303072E4D39E54517a348D89A00a",
      },
      {
        externalAccount: "0xe170915ce32bb8e2ce2a4fcd9113e5298a2e10d2",
        metaTransactionWallet: "0x51FA7e8FE48a2968aC08Ef72374137Fd3a9Fda76",
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x63004Acf0Ace666651E191ad17BC8D85077A09e6": "1.1.0.0-p1",
        "0x6511FB5DBfe95859d8759AdAd5503D656E2555d7": "1.1.0.0-p2"
      },
      MetaTransactionWalletDeployer: "0xbDb92Ca42559adc5adC20a1E4985dC7c476483be"
    },
    fornoURL: 'https://forno.celo.org',
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

