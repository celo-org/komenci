"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@komenci/core");
const base_1 = require("@celo/base");
const MetaTransactionWallet_1 = require("@celo/contractkit/lib/generated/MetaTransactionWallet");
const address_1 = require("@celo/utils/lib/address");
const common_1 = require("@nestjs/common");
const fund_config_1 = require("./fund.config");
const nestjs_console_1 = require("nestjs-console");
let DeployerCommand = class DeployerCommand {
    constructor(networkCfg, fundCfg, deployer, contractKit, logger) {
        this.networkCfg = networkCfg;
        this.fundCfg = fundCfg;
        this.deployer = deployer;
        this.contractKit = contractKit;
        this.logger = logger;
    }
    ensureHasMetaTxWallet(cmd) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield Promise.all(this.networkCfg.relayers.map((relayer) => __awaiter(this, void 0, void 0, function* () {
                const relayerEOA = relayer.externalAccount;
                const wallet = relayer.metaTransactionWallet;
                if (address_1.isValidAddress(wallet)) {
                    spin.info(`Relayer:${relayerEOA} has wallet: ${wallet} ✅`);
                }
                else {
                    spin.info(`Relayer:${relayerEOA} needs wallet. Deploying.`);
                    const receipt = yield this.deployer.deploy(relayerEOA, implementationAddress, metaTxWallet.methods.initialize(relayerEOA).encodeABI()).sendAndWaitForReceipt({
                        from: this.fundCfg.address
                    });
                    if (receipt.status === true) {
                        const event = (yield this.deployer.getPastEvents(this.deployer.eventTypes.WalletDeployed, {
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
            })));
            spin.succeed();
        });
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
    })
], DeployerCommand.prototype, "ensureHasMetaTxWallet", null);
DeployerCommand = __decorate([
    nestjs_console_1.Console({
        name: 'deployer',
        description: 'Manage permissions and meta-tx wallets',
    }),
    __param(0, common_1.Inject(core_1.networkConfig.KEY)),
    __param(1, common_1.Inject(fund_config_1.fundConfig.KEY))
], DeployerCommand);
exports.DeployerCommand = DeployerCommand;
