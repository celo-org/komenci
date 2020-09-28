const MetaTransactionWallet = artifacts.require("MetaTransactionWallet");
const MetaTransactionWalletDeployer = artifacts.require("MetaTransactionWalletDeployer");

const WALLET_ADDRESS = "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47"

module.exports = async function (deployer, network, addresses) {
  await deployer.deploy(MetaTransactionWallet);
  const dep = await deployer.deploy(MetaTransactionWalletDeployer);
  await dep.initialize([WALLET_ADDRESS])
};
