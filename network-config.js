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
      "0x00454cac6dae53f8800f71395b9a174f07a784b1",
      "0xc6f0f9bfb1aed83620ece3eac0add98a65a8574e"
    ],
    contracts: {
      MetaTransactionWalletVersions: {
        "0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x5ee40856c2a73e08B645044B6B8466310640DA9E"
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
