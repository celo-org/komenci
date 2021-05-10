const ProxyCloneFactory = artifacts.require("ProxyCloneFactory");
const InitializableProxy = artifacts.require("InitializableProxy");

module.exports = async function (deployer, network, addresses) {
  deployer.deploy(ProxyCloneFactory);
  deployer.then(async () => {
      const initializableProxy = await InitializableProxy.deployed()
      const cloneFactory = await ProxyCloneFactory.deployed()
      await cloneFactory.setImplementationAddress(initializableProxy.address)
  })
};
