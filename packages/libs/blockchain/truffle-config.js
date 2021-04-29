const Web3 = require('web3')
const bip32 = require('bip32')
const bip39 = require('bip39')

const LocalWallet = require('@celo/wallet-local').LocalWallet
const CeloProvider = require('@celo/connect/lib/celo-provider').CeloProvider
const { Connection } = require('@celo/connect')
const mnemonics = require('./dist/truffle-deployer-config')

const generatePrivateKey = (mnemonic, derivations) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const node = bip32.fromSeed(seed)
  const newNode = derivations.reduce((n, derivation) => {
    return n.derive(derivation)
  }, node)
  return newNode.privateKey.toString('hex')
}

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
  const connection = new Connection(new Web3(httpProvider), wallet)
  return new CeloProvider(httpProvider, connection)
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

  contracts_build_directory: "../contracts/artefacts",
  migrations_directory: ".//migrations",
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
