const MetaTransactionWallet = artifacts.require("MetaTransactionWallet");

module.exports = async function (deployer, network, addresses) {
  await deployer.deploy(MetaTransactionWallet);
};
