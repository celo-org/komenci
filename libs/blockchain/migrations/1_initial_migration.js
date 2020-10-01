const Migrations = artifacts.require("Migrations");

module.exports = function (deployer, network, addresses) {
  deployer.deploy(Migrations);
};
