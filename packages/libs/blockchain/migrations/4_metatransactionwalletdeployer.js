const MetaTransactionWalletDeployer = artifacts.require("MetaTransactionWalletDeployer");

module.exports = async function (deployer, network, addresses) {
  await deployer.deploy(MetaTransactionWalletDeployer);
};
