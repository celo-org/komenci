const ProxyCloneFactory = artifacts.require("ProxyCloneFactory");
const ProxyV2 = artifacts.require("ProxyV2");

module.exports = async function (deployer, network, addresses) {
  deployer.deploy(ProxyCloneFactory);
  deployer.then(async () => {
      const proxyV2 = await ProxyV2.deployed()
      const cloneFactory = await ProxyCloneFactory.deployed()
      await cloneFactory.setProxyAddress(proxyV2.address)
  })
};
