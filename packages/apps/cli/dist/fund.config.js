"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var wallet_config_1 = require("@komenci/blockchain/dist/config/wallet.config");
var core_1 = require("@komenci/core");
var address_1 = require("@celo/utils/lib/address");
var config_1 = require("@nestjs/config");
var bip32 = require("bip32");
var bip39 = require("bip39");
var truffle_deployer_config_1 = require("@komenci/blockchain/dist/truffle-deployer-config");
exports.generatePrivateKeyWithDerivations = function (mnemonic, derivations) {
    var seed = bip39.mnemonicToSeedSync(mnemonic);
    var node = bip32.fromSeed(seed);
    var newNode = derivations.reduce(function (n, derivation) {
        return n.derive(derivation);
    }, node);
    return newNode.privateKey.toString('hex');
};
var buildFundConfig = function (mnemonic) {
    var privateKey = exports.generatePrivateKeyWithDerivations(mnemonic, [0, 0]);
    var address = address_1.privateKeyToAddress(privateKey);
    return {
        type: wallet_config_1.WalletType.Local,
        privateKey: privateKey,
        address: address
    };
};
exports.fundConfig = config_1.registerAs('fund', function () {
    var network = core_1.Network[process.env.NETWORK];
    if (!network) {
        throw Error("Unknown network: " + process.env.NETWORK);
    }
    if (network === core_1.Network.rc1) {
        return {
            type: wallet_config_1.WalletType.AzureHSM,
            address: process.env.FUND_ADDRESS,
            vaultName: process.env.AZURE_VAULT_NAME,
            keyName: process.env.AZURE_KEY_NAME
        };
    }
    if (truffle_deployer_config_1.default[network] === undefined) {
        throw Error("No mnemonic found for " + network + ", check truffler-deployer-config");
    }
    return buildFundConfig(truffle_deployer_config_1.default[network]);
});
