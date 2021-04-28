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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@komenci/core");
var base_1 = require("@celo/base");
var contractkit_1 = require("@celo/contractkit");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/generated/MetaTransactionWallet");
var MetaTransactionWalletDeployer_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer");
var address_1 = require("@celo/utils/lib/address");
var common_1 = require("@nestjs/common");
var fund_config_1 = require("./fund.config");
var commander_1 = require("commander");
var nestjs_console_1 = require("nestjs-console");
var nestjs_pino_1 = require("nestjs-pino");
var DeployerCommand = (function () {
    function DeployerCommand(networkCfg, fundCfg, deployer, contractKit, logger) {
        this.networkCfg = networkCfg;
        this.fundCfg = fundCfg;
        this.deployer = deployer;
        this.contractKit = contractKit;
        this.logger = logger;
    }
    DeployerCommand.prototype.ensureHasMetaTxWallet = function (cmd) {
        return __awaiter(this, void 0, void 0, function () {
            var opts, availableImplementations, implementationAddress, account, metaTxWallet, spin;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opts = cmd.opts();
                        availableImplementations = Object.keys(this.networkCfg.contracts.MetaTransactionWalletVersions);
                        if (opts.implementation == null) {
                            implementationAddress = availableImplementations[availableImplementations.length - 1];
                        }
                        else {
                            implementationAddress = availableImplementations.find(function (impl) {
                                return base_1.normalizeAddress(impl) === base_1.normalizeAddress(opts.implementation);
                            });
                            if (implementationAddress === undefined) {
                                throw (new Error("Invalid implementation address"));
                            }
                        }
                        account = this.contractKit.getWallet().getAccounts()[0];
                        console.log('Deploying from: ', account);
                        metaTxWallet = MetaTransactionWallet_1.newMetaTransactionWallet(this.contractKit.web3, implementationAddress);
                        spin = nestjs_console_1.createSpinner();
                        spin.start("Ensuring all relayers have wallets");
                        return [4, Promise.all(this.networkCfg.relayers.map(function (relayer) { return __awaiter(_this, void 0, void 0, function () {
                                var relayerEOA, wallet, receipt, event_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            relayerEOA = relayer.externalAccount;
                                            wallet = relayer.metaTransactionWallet;
                                            if (!address_1.isValidAddress(wallet)) return [3, 1];
                                            spin.info("Relayer:" + relayerEOA + " has wallet: " + wallet + " \u2705");
                                            return [3, 5];
                                        case 1:
                                            spin.info("Relayer:" + relayerEOA + " needs wallet. Deploying.");
                                            return [4, this.deployer.deploy(relayerEOA, implementationAddress, metaTxWallet.methods.initialize(relayerEOA).encodeABI()).sendAndWaitForReceipt({
                                                    from: this.fundCfg.address
                                                })];
                                        case 2:
                                            receipt = _a.sent();
                                            if (!(receipt.status === true)) return [3, 4];
                                            return [4, this.deployer.getPastEvents(this.deployer.eventTypes.WalletDeployed, {
                                                    fromBlock: receipt.blockNumber,
                                                    toBlock: receipt.blockNumber
                                                })];
                                        case 3:
                                            event_1 = (_a.sent()).find(function (evt) {
                                                return evt.returnValues.owner.toLocaleLowerCase() === relayerEOA;
                                            });
                                            spin.info("Relayer:" + relayerEOA + " wallet deployed to: " + event_1.returnValues.wallet);
                                            return [3, 5];
                                        case 4:
                                            spin.fail("Relayer:" + relayerEOA + " could not deploy wallet - tx:" + receipt.transactionHash);
                                            _a.label = 5;
                                        case 5: return [2];
                                    }
                                });
                            }); }))];
                    case 1:
                        _a.sent();
                        spin.succeed();
                        return [2];
                }
            });
        });
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
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], DeployerCommand.prototype, "ensureHasMetaTxWallet", null);
    DeployerCommand = __decorate([
        nestjs_console_1.Console({
            name: 'deployer',
            description: 'Manage permissions and meta-tx wallets',
        }),
        __param(0, common_1.Inject(core_1.networkConfig.KEY)),
        __param(1, common_1.Inject(fund_config_1.fundConfig.KEY)),
        __metadata("design:paramtypes", [Object, Object, MetaTransactionWalletDeployer_1.MetaTransactionWalletDeployerWrapper,
            contractkit_1.ContractKit,
            nestjs_pino_1.Logger])
    ], DeployerCommand);
    return DeployerCommand;
}());
exports.DeployerCommand = DeployerCommand;
