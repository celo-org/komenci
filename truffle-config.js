const path = require('path');
const config = require('dotenv').config
const Web3 = require('web3')

const LocalWallet = require('./libs/celo/packages/contractkit/lib/wallets/local-wallet').LocalWallet
const CeloProvider = require('./libs/celo/packages/contractkit/lib/providers/celo-provider').CeloProvider
const generateUtils = require('./libs/celo/packages/celotool/lib/lib/generate_utils')
const networkConfig = require('./network-config')

const generatePrivateKey = generateUtils.generatePrivateKey;
const coerceMnemonicAccountType = generateUtils.coerceMnemonicAccountType;


const getMnemonicForEnv = (env) => {
  const envMemonicResult = config({ path: './libs/celo/.env.mnemonic.'+env })
  if (envMemonicResult.error) {
    throw envMemonicResult.error
  } else if (envMemonicResult.parsed) {
    return envMemonicResult.parsed.MNEMONIC
  }
  throw new Error('Could not get mnmonic')
}

const walletCache = {}
const walletForEnv = (env) => {
  if (walletCache[env] == undefined) {
    const mnemonic = getMnemonicForEnv(env)
    const privateKey = generatePrivateKey(mnemonic, coerceMnemonicAccountType('tx_node'), 0)
    const wallet = new LocalWallet();
    wallet.addAccount(privateKey);

    walletCache[env] = wallet
  }

  return walletCache[env]
}

const providerForEnv = (env) => {
  const wallet = walletForEnv(env)
  const httpProvider = new Web3.providers.HttpProvider(
    networkConfig[env].fornoURL
  );
  return new CeloProvider(httpProvider, wallet)
}

const migratorAddressForEnv = (env) => {
  const wallet = walletForEnv(env)
  return wallet.getAccounts()[0]
}

const baseNetworkConfig = {
  gas: 5000000,
  gasPrice: 100000000000,
}

module.exports = {
  plugins: ["truffle-security"],

  contracts_build_directory: "./libs/celo/packages/protocol/build/contracts",
  migrations_directory: "./libs/blockchain/migrations",
  networks: {
    alfajores: {
      ...baseNetworkConfig,
      provider: () => providerForEnv('alfajores'),
      from: migratorAddressForEnv('alfajores'),
      network_id: 44787,
    },
    alfajoresstaging: {
      ...baseNetworkConfig,
      provider: () => providerForEnv('alfajoresstaging'),
      from: migratorAddressForEnv('alfajoresstaging'),
      network_id: 1101,
      gasPrice: 0,
    },
    baklava: {
      ...baseNetworkConfig,
      provider: () => providerForEnv('baklava'),
      from: migratorAddressForEnv('baklava'),
      network_id: 62320,
    },
    baklavastaging: {
      provider: () => providerForEnv('baklavastaging'),
      from: migratorAddressForEnv('baklavastaging'),
      network_id: 44787,
      gasPrice: 0,
    },
    rc1: {
      provider: () => providerForEnv('rc1'),
      from: migratorAddressForEnv('rc1'),
      network_id: 42220,
    },
    test: {
      ...baseNetworkConfig,
      host: 'localhost',
      port: '8565',
      network_id: 1101,
    },
  },
};
