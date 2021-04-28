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
var common_1 = require("@nestjs/common");
var result_1 = require("@celo/base/lib/result");
var contractkit_1 = require("@celo/contractkit");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWallet");
var method_filter_1 = require("../wallet/method-filter");
var tx_parser_service_1 = require("../wallet/tx-parser.service");
var wallet_service_1 = require("../wallet/wallet.service");
var SubsidyService = (function () {
    function SubsidyService(walletService, txParserService, contractKit) {
        this.walletService = walletService;
        this.txParserService = txParserService;
        this.contractKit = contractKit;
    }
    SubsidyService.prototype.isValid = function (input, session) {
        return __awaiter(this, void 0, void 0, function () {
            var walletValid, requestTxRes, _a, _b, _c, _d, _e, _f, approveTxRes, _g, _h, _j, _k, _l, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0: return [4, this.walletService.isValidWallet(input.walletAddress, session.externalAccount)];
                    case 1:
                        walletValid = _o.sent();
                        if (walletValid.ok === false) {
                            return [2, walletValid];
                        }
                        _b = (_a = this.txParserService).parse;
                        _c = [input.requestTx,
                            input.walletAddress];
                        _e = (_d = new method_filter_1.MethodFilter()).addContract;
                        _f = [contractkit_1.CeloContract.Attestations];
                        return [4, this.contractKit.contracts.getAttestations()];
                    case 2: return [4, _b.apply(_a, _c.concat([_e.apply(_d, _f.concat([_o.sent(),
                                ["request"]]))]))];
                    case 3:
                        requestTxRes = _o.sent();
                        if (requestTxRes.ok === false) {
                            return [2, requestTxRes];
                        }
                        if (!(input.approveTx !== undefined)) return [3, 6];
                        _h = (_g = this.txParserService).parse;
                        _j = [input.approveTx,
                            input.walletAddress];
                        _l = (_k = new method_filter_1.MethodFilter()).addContract;
                        _m = [contractkit_1.CeloContract.StableToken];
                        return [4, this.contractKit.contracts.getStableToken()];
                    case 4: return [4, _h.apply(_g, _j.concat([_l.apply(_k, _m.concat([_o.sent(),
                                ["approve"]]))]))];
                    case 5:
                        approveTxRes = _o.sent();
                        if (approveTxRes.ok === false) {
                            return [2, approveTxRes];
                        }
                        _o.label = 6;
                    case 6: return [2, result_1.Ok(true)];
                }
            });
        });
    };
    SubsidyService.prototype.buildTransactionBatch = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var identifier, walletAddress, attestationsRequested, requestTx, approveTx, batch, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        identifier = input.identifier, walletAddress = input.walletAddress, attestationsRequested = input.attestationsRequested, requestTx = input.requestTx, approveTx = input.approveTx;
                        batch = [];
                        _b = (_a = batch).push;
                        return [4, this.buildSubsidyTransfer(attestationsRequested, walletAddress)];
                    case 1:
                        _b.apply(_a, [_c.sent()]);
                        if (approveTx !== undefined) {
                            batch.push(approveTx);
                        }
                        batch.push(requestTx);
                        return [2, batch];
                }
            });
        });
    };
    SubsidyService.prototype.buildSubsidyTransfer = function (attestationsRequested, account) {
        return __awaiter(this, void 0, void 0, function () {
            var attestations, stableToken, fee;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.contractKit.contracts.getAttestations()];
                    case 1:
                        attestations = _a.sent();
                        return [4, this.contractKit.contracts.getStableToken()];
                    case 2:
                        stableToken = _a.sent();
                        return [4, attestations.getAttestationFeeRequired(attestationsRequested)];
                    case 3:
                        fee = _a.sent();
                        return [2, MetaTransactionWallet_1.toRawTransaction(stableToken.transfer(account, fee.toFixed()).txo)];
                }
            });
        });
    };
    SubsidyService = __decorate([
        common_1.Injectable(),
        __metadata("design:paramtypes", [wallet_service_1.WalletService,
            tx_parser_service_1.TxParserService,
            contractkit_1.ContractKit])
    ], SubsidyService);
    return SubsidyService;
}());
exports.SubsidyService = SubsidyService;
