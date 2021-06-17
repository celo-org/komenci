const InitializableProxy = artifacts.require("InitializableProxy");

module.exports = async function (deployer, network, addresses) {
  await deployer.deploy(InitializableProxy);
};
