const ProxyV2 = artifacts.require("ProxyV2");

module.exports = async function (deployer, network, addresses) {
  await deployer.deploy(ProxyV2);
};
