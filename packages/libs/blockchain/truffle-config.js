const Web3 = require('web3')

const LocalWallet = require('@celo/local-wallet').LocalWallet
const CeloProvider = require('@celo/contractkit/lib/providers/celo-provider').CeloProvider
const mnemonics = require('./dist/truffle-deployer-config')

const generatePrivateKey = generateUtils.generatePrivateKeyWithDerivations
const fornoURLForEnv = (env) => "https://"+env+"-forno.celo-testnet.org"

const walletCache = {}
const walletForEnv = (env) => {
  if (walletCache[env] == undefined) {
    const mnemonic = mnemonics[env]
    const wallet = new LocalWallet();
    const privateKey = generatePrivateKey(mnemonic, [0, 0])
    wallet.addAccount(privateKey);
    walletCache[env] = wallet
  }

  return walletCache[env]
}

const providerForEnv = (env) => {
  const wallet = walletForEnv(env)
  const httpProvider = new Web3.providers.HttpProvider(
    fornoURLForEnv(env),
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
