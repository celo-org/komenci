"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fundConfig = exports.generatePrivateKeyWithDerivations = void 0;
const wallet_config_1 = require("@app/blockchain/config/wallet.config");
const network_config_1 = require("@app/utils/config/network.config");
const address_1 = require("@celo/utils/lib/address");
const config_1 = require("@nestjs/config");
const bip32 = __importStar(require("bip32"));
const bip39 = __importStar(require("bip39"));
const mnemonics = require('../../../truffle-deployer-config');
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
    const network = network_config_1.Network[process.env.NETWORK];
    if (!network) {
        throw Error(`Unknown network: ${process.env.NETWORK}`);
    }
    if (network === network_config_1.Network.rc1) {
        return {
            type: wallet_config_1.WalletType.AzureHSM,
            address: process.env.FUND_ADDRESS,
            vaultName: process.env.AZURE_VAULT_NAME,
            keyName: process.env.AZURE_KEY_NAME
        };
    }
    if (mnemonics[network] === undefined) {
        throw Error(`No mnemonic found for ${network}, check truffler-deployer-config`);
    }
    return buildFundConfig(mnemonics[network]);
});
//# sourceMappingURL=fund.config.js.map