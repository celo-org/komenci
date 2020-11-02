const MetaTransactionWalletDeployer = artifacts.require("MetaTransactionWalletDeployer");

module.exports = async function (deployer, network, addresses) {
  const mtwd = await deployer.deploy(MetaTransactionWalletDeployer);
  await mtwd.initialize([])
};
