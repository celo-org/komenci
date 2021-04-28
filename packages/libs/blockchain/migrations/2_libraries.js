const Signatures = artifacts.require("Signatures");
const MetaTransactionWallet = artifacts.require("MetaTransactionWallet");

module.exports = function (deployer, network, addresses) {
  deployer.deploy(Signatures);
  deployer.link(Signatures, [MetaTransactionWallet])
};
