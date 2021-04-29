"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_config_1 = require("@komenci/blockchain/dist/config/wallet.config");
const core_1 = require("@komenci/core");
const address_1 = require("@celo/utils/lib/address");
const config_1 = require("@nestjs/config");
const bip32 = __importStar(require("bip32"));
const bip39 = __importStar(require("bip39"));
const truffle_deployer_config_1 = __importDefault(require("@komenci/blockchain/dist/truffle-deployer-config"));
exports.generatePrivateKeyWithDerivations = (mnemonic, derivations) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const node = bip32.fromSeed(seed);
    const newNode = derivations.reduce((n, derivation) => {
        return n.derive(derivation);
    }, node);
    return newNode.privateKey.toString('hex');
};
const buildFundConfig = (mnemonic) => {
    const privateKey = exports.generatePrivateKeyWithDerivations(mnemonic, [0, 0]);
    const address = address_1.privateKeyToAddress(privateKey);
    return {
        type: wallet_config_1.WalletType.Local,
        privateKey,
        address
    };
};
exports.fundConfig = config_1.registerAs('fund', () => {
    const network = core_1.Network[process.env.NETWORK];
    if (!network) {
        throw Error(`Unknown network: ${process.env.NETWORK}`);
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
        throw Error(`No mnemonic found for ${network}, check truffler-deployer-config`);
    }
    return buildFundConfig(truffle_deployer_config_1.default[network]);
});
