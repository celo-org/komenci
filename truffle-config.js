const Web3 = require('web3')
const LocalWallet = require('./libs/celo/packages/contractkit/lib/wallets/local-wallet').LocalWallet
const CeloProvider = require('./libs/celo/packages/contractkit/lib/providers/celo-provider').CeloProvider

const DEV_WALLET_PRIVATE_KEY = "0x7403568bea8a303d7645bb66f10c9df31fe549cb07a7a908cb9a6cc17b1d6415"
const WALLET_ADDRESS = "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47"
const NODE_URL = "https://alfajores-forno.celo-testnet.org"
const gasLimit = 2000000

module.exports = {
  contracts_build_directory: "./libs/celo/packages/protocol/build/contracts",
  migrations_directory: "./libs/blockchain/migrations",
  networks: {
    alfajores: {
      provider: () => {
        const wallet = new LocalWallet();
        wallet.addAccount(DEV_WALLET_PRIVATE_KEY);
        const httpProvider = new Web3.providers.HttpProvider(NODE_URL);
        return new CeloProvider(httpProvider, wallet)
      },
      from: WALLET_ADDRESS,
      network_id: 44787,
      gas: gasLimit,
      gasPrice: 100000000000,
    },
  },
};
