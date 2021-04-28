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
var funding_service_1 = require("@komenci/blockchain/dist/funding.service");
var core_1 = require("@komenci/core");
var common_1 = require("@nestjs/common");
var fund_config_1 = require("./fund.config");
var bignumber_js_1 = require("bignumber.js");
var commander_1 = require("commander");
var nestjs_console_1 = require("nestjs-console");
var nestjs_pino_1 = require("nestjs-pino");
var FundCommand = (function () {
    function FundCommand(networkCfg, fundCfg, fundingSvc, logger) {
        this.networkCfg = networkCfg;
        this.fundCfg = fundCfg;
        this.fundingSvc = fundingSvc;
        this.logger = logger;
    }
    FundCommand.prototype.disburse = function (cmd) {
        return __awaiter(this, void 0, void 0, function () {
            var opts, spin, fund, relayers, summary, e_1, receipts, results, failedTxs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opts = cmd.opts();
                        spin = nestjs_console_1.createSpinner();
                        fund = this.fundCfg.address;
                        spin.start("Disbursing funds");
                        relayers = [];
                        if (opts.relayer.length > 0) {
                            opts.relayer.forEach(function (r) {
                                var relayer = _this.networkCfg.relayers.find(function (pr) { return pr.externalAccount === r; });
                                if (relayer) {
                                    relayers.push(relayer);
                                }
                                else {
                                    spin.warn("Skipping " + r + ": relayer not found in config");
                                }
                            });
                        }
                        else {
                            relayers = this.networkCfg.relayers;
                        }
                        if (relayers.length === 0) {
                            spin.fail("No relayers to fund");
                            process.exit(1);
                        }
                        spin.info("Funding relayers: ");
                        relayers.forEach(function (r) {
                            spin.info("   - " + r.externalAccount);
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.fundingSvc.disburseFunds(fund, relayers, opts.cusdAmount, opts.celoAmount)];
                    case 2:
                        summary = _a.sent();
                        return [3, 4];
                    case 3:
                        e_1 = _a.sent();
                        spin.fail(e_1.message);
                        process.exit(1);
                        return [3, 4];
                    case 4:
                        spin.succeed('Funding transactions submitted');
                        spin.start("Funding relayers");
                        receipts = [];
                        return [4, Promise.all(Object.keys(summary).map(function (relayer) { return __awaiter(_this, void 0, void 0, function () {
                                var celoTxHash, cUSDTxHash;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4, summary[relayer].celo.getHash()];
                                        case 1:
                                            celoTxHash = _a.sent();
                                            spin.info("-celo-> Relayer#" + relayer);
                                            spin.info("        " + celoTxHash);
                                            return [4, summary[relayer].cUSD.getHash()];
                                        case 2:
                                            cUSDTxHash = _a.sent();
                                            spin.info("-cUSD-> Relayer#" + relayer);
                                            spin.info("        " + cUSDTxHash);
                                            return [2, Promise.all([
                                                    summary[relayer].celo.waitReceipt(),
                                                    summary[relayer].cUSD.waitReceipt()
                                                ])];
                                    }
                                });
                            }); }))];
                    case 5:
                        results = _a.sent();
                        failedTxs = 0;
                        results.forEach(function (relayerReceipts) {
                            relayerReceipts.forEach(function (receipt) {
                                if (receipt.status === true) {
                                    spin.succeed("Tx:" + receipt.transactionHash + " [OK]");
                                }
                                else {
                                    spin.warn("Tx:" + receipt.transactionHash + " [REVERT]");
                                    failedTxs += 1;
                                }
                            });
                        });
                        if (failedTxs > 0) {
                            spin.fail(failedTxs + "/" + results.length * 2 + " failed txs. Check summary");
                        }
                        else {
                            spin.succeed('All transfers completed successfully!');
                        }
                        return [2];
                }
            });
        });
    };
    FundCommand.prototype.getFundBalance = function (cmd) {
        return __awaiter(this, void 0, void 0, function () {
            var spin, wallet, balances, exp;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        spin = nestjs_console_1.createSpinner();
                        wallet = this.fundCfg.address;
                        this.logger.log({ fund: wallet });
                        spin.start('Getting fund balances');
                        return [4, this.fundingSvc.getFundBalance(wallet)];
                    case 1:
                        balances = _b.sent();
                        spin.succeed('Done loading balances');
                        exp = new bignumber_js_1.default(10).pow(18);
                        this.logger.log((_a = {},
                            _a[wallet] = {
                                "celo": balances.celo.div(exp).toFixed(),
                                "cUSD": balances.cUSD.div(exp).toFixed()
                            },
                            _a));
                        return [2];
                }
            });
        });
    };
    FundCommand.prototype.getBalance = function (cmd) {
        return __awaiter(this, void 0, void 0, function () {
            var flags, spin, balanceSummary, exp, resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        flags = cmd.opts();
                        this.logger.log(this.networkCfg.relayers);
                        spin = nestjs_console_1.createSpinner();
                        spin.start('Collecting relayer balances');
                        return [4, this.fundingSvc.getRelayerBalances(this.networkCfg.relayers)];
                    case 1:
                        balanceSummary = _a.sent();
                        spin.start('Done loading balances');
                        exp = new bignumber_js_1.default(10).pow(18);
                        resp = this.networkCfg.relayers.reduce(function (acc, r, idx) {
                            var _a;
                            acc[r.externalAccount] = (_a = {
                                    "celo": balanceSummary[r.externalAccount].celoBalance.div(exp).toFixed()
                                },
                                _a[r.metaTransactionWallet] = {
                                    "cUSD": balanceSummary[r.externalAccount].cUSDBalance.div(exp).toFixed()
                                },
                                _a);
                            return acc;
                        }, {});
                        this.logger.log(resp);
                        return [2];
                }
            });
        });
    };
    __decorate([
        nestjs_console_1.Command({
            command: 'disburse',
            description: 'Disburse funds to the relayers and their meta-tx wallets',
            options: [
                {
                    flags: '-co, --celo-amount <celoValue>',
                    required: false,
                    defaultValue: 1,
                    fn: function (v) { return parseFloat(v); },
                    description: 'The amount of Celo to transfer to each relayer'
                },
                {
                    flags: '-cu, --cusd-amount <cUSDValue>',
                    required: false,
                    defaultValue: 2,
                    fn: function (v) { return parseFloat(v); },
                    description: 'The amount of cUSD to transfer to each relayer meta-tx wallet'
                },
                {
                    flags: '-r, --relayer <relayer>',
                    required: false,
                    defaultValue: [],
                    fn: function (r, list) { return list.concat([r]); },
                    description: 'Which relayer to fund (repetable), if non provided will fund all'
                }
            ]
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], FundCommand.prototype, "disburse", null);
    __decorate([
        nestjs_console_1.Command({
            command: 'getFundBalance',
            description: 'Check fund balance',
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], FundCommand.prototype, "getFundBalance", null);
    __decorate([
        nestjs_console_1.Command({
            command: 'getRelayerBalance',
            description: 'Check relayer balances',
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], FundCommand.prototype, "getBalance", null);
    FundCommand = __decorate([
        nestjs_console_1.Console({
            name: 'fund',
            description: 'Manage the fund and relayers',
        }),
        __param(0, common_1.Inject(core_1.networkConfig.KEY)),
        __param(1, common_1.Inject(fund_config_1.fundConfig.KEY)),
        __metadata("design:paramtypes", [Object, Object, funding_service_1.FundingService,
            nestjs_pino_1.Logger])
    ], FundCommand);
    return FundCommand;
}());
exports.FundCommand = FundCommand;
