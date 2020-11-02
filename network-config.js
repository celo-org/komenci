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
        "0x88a2b9B8387A1823D821E406b4e951337fa1D46D": "1.0.0"
      },
      MetaTransactionWalletDeployer: "0x47b05993C360dEA811ACe7eC725897aCB74AaBA5"
    },
    fornoURL: fornoURLForEnv('alfajores'),
    fundMnemonic: getFundMnemonic('ALFAJORES'),
    odis: {
      publicKey: 'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
      url: 'https://us-central1-celo-phone-number-privacy.cloudfunctions.net'
    }
  },
  alfajoresstaging: {
    relayers: [ ],
    metaTransactionWalletImplementations: {
      "0x0": "1.0.0"
    },
    metaTransactionWalletDeployer: "0x0",
    fornoURL: fornoURLForEnv('alfajoresstaging'),
    fundMnemonic: getFundMnemonic('ALFAJORES_STAGING'),
    odis: {
      publicKey: '7FsWGsFnmVvRfMDpzz95Np76wf/1sPaK0Og9yiB+P8QbjiC8FV67NBans9hzZEkBaQMhiapzgMR6CkZIZPvgwQboAxl65JWRZecGe5V3XO4sdKeNemdAZ2TzQuWkuZoA',
      url: 'https://us-central1-celo-phone-number-privacy-stg.cloudfunctions.net'
    }
  },
  baklava: {
    relayers: [ ],
    metaTransactionWalletImplementations: {
      "0x0": "1.0.0"
    },
    metaTransactionWalletDeployer: "0x0",
    fornoURL: fornoURLForEnv('baklava'),
    fundMnemonic: getFundMnemonic('BAKLAVA'),
    odis: {
      publicKey: "",
      url: ""
    }
  },
  baklavastaging: {
    relayers: [ ],
    metaTransactionWalletImplementations: {
      "0x0": "1.0.0"
    },
    metaTransactionWalletDeployer: "0x0",
    fornoURL: fornoURLForEnv('baklavastaging'),
    fundMnemonic: getFundMnemonic('BAKLAVA_STAGING'),
    odis: {
      publicKey: "",
      url: ""
    }
  },
  rc1: {
    relayers: [ ],
    metaTransactionWalletImplementations: {
      "0x0": "1.0.0"
    },
    metaTransactionWalletDeployer: "0x0",
    fundMnemonic: getFundMnemonic('RC1'),
    odis: {
      publicKey: 'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
      url: 'https://us-central1-celo-pgpnp-mainnet.cloudfunctions.net'
    }
  },
};
