const fornoURLForEnv = (env) => "https://"+env+"-forno.celo-testnet.org"
const dotenv = require('dotenv')
const fundMnemonicConfig = dotenv.config({path: './.env.mnemonic.fund'})

const getFundMnemonic = (key) => {
  if (fundMnemonicConfig.error) {
    return ""
  }

  return fundMnemonicConfig.parsed["FUND_"+key+"_MNEMONIC"] || ""
}

module.exports = {
  alfajores: {
    relayers: [
      {
        externalAccount: "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47",
        metaTransactionWallet: "0xcb361f5852eefdd5ddfc593924405c86c79840b2"
      }
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x88a2b9B8387A1823D821E406b4e951337fa1D46D": "1.0.0",
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0xb1Feb55F2BF2eCfb32CF8E09ce397Acf54414A45"
    },
    fornoURL: fornoURLForEnv('alfajores'),
    fund: {
      mnemonic: getFundMnemonic('ALFAJORES'),
    },
    odis: {
      publicKey: 'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
      url: 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
    }
  },
  alfajoresstaging: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x5ee40856c2a73e08B645044B6B8466310640DA9E"
    },
    fornoURL: fornoURLForEnv('alfajoresstaging'),
    fund: {
      mnemonic: getFundMnemonic('ALFAJORES_STAGING')
    },
    odis: {
      publicKey: '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
      url: 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
    }
  },
  baklava: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x0": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x0",
    },
    fund: {
      mnemonic: getFundMnemonic('BAKLAVA')
    },
    fornoURL: fornoURLForEnv('baklava'),
    odis: {
      publicKey: "",
      url: ""
    }
  },
  baklavastaging: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x0": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x0",
    },
    fornoURL: fornoURLForEnv('baklavastaging'),
    fund: {
      mnemonic: getFundMnemonic('BAKLAVA_STAGING')
    },
    odis: {
      publicKey: "",
      url: ""
    }
  },
  rc1: {
    relayers: [ ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x0": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x0",
    },
    fund: {
      mnemonic: getFundMnemonic('RC1')
    },
    fornoURL: fornoURLForEnv('rc1'),
    odis: {
      publicKey: 'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
      url: 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net'
    }
  },
};
