const MetaTransactionWalletDeployer = artifacts.require("MetaTransactionWalletDeployer");
const MetaTransactionWallet = artifacts.require("MetaTransactionWallet");

const WALLET_ADDRESS = "0xa7d74cb4fca9458757cfc8b90d9b38a126f68b47"

module.exports = async function (deployer, network, addresses) {
  var impl = await MetaTransactionWallet.deployed()
  var dep = await MetaTransactionWalletDeployer.deployed()

  await dep.deploy(
    WALLET_ADDRESS,
    impl.address,
    impl.contract.methods.initialize(WALLET_ADDRESS).encodeABI()
  )
};
