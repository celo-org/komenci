"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployerCommand = void 0;
const wallet_config_1 = require("@komenci/blockchain/config/wallet.config");
const network_config_1 = require("@app/utils/config/network.config");
const base_1 = require("@celo/base");
const contractkit_1 = require("@celo/contractkit");
const MetaTransactionWallet_1 = require("@celo/contractkit/lib/generated/MetaTransactionWallet");
const MetaTransactionWalletDeployer_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer");
const address_1 = require("@celo/utils/lib/address");
const common_1 = require("@nestjs/common");
const fund_config_1 = require("./fund.config");
const commander_1 = __importDefault(require("commander"));
const nestjs_console_1 = require("nestjs-console");
const nestjs_pino_1 = require("nestjs-pino");
let DeployerCommand = class DeployerCommand {
    constructor(networkCfg, fundCfg, deployer, contractKit, logger) {
        this.networkCfg = networkCfg;
        this.fundCfg = fundCfg;
        this.deployer = deployer;
        this.contractKit = contractKit;
        this.logger = logger;
    }
    async ensureHasMetaTxWallet(cmd) {
        const opts = cmd.opts();
        const availableImplementations = Object.keys(this.networkCfg.contracts.MetaTransactionWalletVersions);
        let implementationAddress;
        if (opts.implementation == null) {
            implementationAddress = availableImplementations[availableImplementations.length - 1];
        }
        else {
            implementationAddress = availableImplementations.find((impl) => {
                return base_1.normalizeAddress(impl) === base_1.normalizeAddress(opts.implementation);
            });
            if (implementationAddress === undefined) {
                throw (new Error("Invalid implementation address"));
            }
        }
        const account = this.contractKit.getWallet().getAccounts()[0];
        console.log('Deploying from: ', account);
        const metaTxWallet = MetaTransactionWallet_1.newMetaTransactionWallet(this.contractKit.web3, implementationAddress);
        const spin = nestjs_console_1.createSpinner();
        spin.start("Ensuring all relayers have wallets");
        await Promise.all(this.networkCfg.relayers.map(async (relayer) => {
            const relayerEOA = relayer.externalAccount;
            const wallet = relayer.metaTransactionWallet;
            if (address_1.isValidAddress(wallet)) {
                spin.info(`Relayer:${relayerEOA} has wallet: ${wallet} ✅`);
            }
            else {
                spin.info(`Relayer:${relayerEOA} needs wallet. Deploying.`);
                const receipt = await this.deployer.deploy(relayerEOA, implementationAddress, metaTxWallet.methods.initialize(relayerEOA).encodeABI()).sendAndWaitForReceipt({
                    from: this.fundCfg.address
                });
                if (receipt.status === true) {
                    const event = (await this.deployer.getPastEvents(this.deployer.eventTypes.WalletDeployed, {
                        fromBlock: receipt.blockNumber,
                        toBlock: receipt.blockNumber
                    })).find((evt) => {
                        return evt.returnValues.owner.toLocaleLowerCase() === relayerEOA;
                    });
                    spin.info(`Relayer:${relayerEOA} wallet deployed to: ${event.returnValues.wallet}`);
                }
                else {
                    spin.fail(`Relayer:${relayerEOA} could not deploy wallet - tx:${receipt.transactionHash}`);
                }
            }
        }));
        spin.succeed();
    }
};
__decorate([
    nestjs_console_1.Command({
        command: 'ensureHasMetaTxWallet',
        description: 'Ensure that all relayers have a meta-tx wallet deployed',
        options: [
            {
                flags: '-i, --implementation <address>',
                required: false,
                defaultValue: null,
                description: 'The implementation address to use'
            },
        ]
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof commander_1.default !== "undefined" && commander_1.default.Command) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], DeployerCommand.prototype, "ensureHasMetaTxWallet", null);
DeployerCommand = __decorate([
    nestjs_console_1.Console({
        name: 'deployer',
        description: 'Manage permissions and meta-tx wallets',
    }),
    __param(0, common_1.Inject(network_config_1.networkConfig.KEY)),
    __param(1, common_1.Inject(fund_config_1.fundConfig.KEY)),
    __metadata("design:paramtypes", [typeof (_b = typeof network_config_1.NetworkConfig !== "undefined" && network_config_1.NetworkConfig) === "function" ? _b : Object, typeof (_c = typeof wallet_config_1.WalletConfig !== "undefined" && wallet_config_1.WalletConfig) === "function" ? _c : Object, MetaTransactionWalletDeployer_1.MetaTransactionWalletDeployerWrapper,
        contractkit_1.ContractKit, typeof (_d = typeof nestjs_pino_1.Logger !== "undefined" && nestjs_pino_1.Logger) === "function" ? _d : Object])
], DeployerCommand);
exports.DeployerCommand = DeployerCommand;
//# sourceMappingURL=deployer.command.js.map