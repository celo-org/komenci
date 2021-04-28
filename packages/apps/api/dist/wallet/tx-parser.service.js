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
var contractkit_1 = require("@celo/contractkit");
var base_1 = require("@celo/base");
var core_1 = require("@komenci/core");
var decode_txs_1 = require("../wallet/decode-txs");
var errors_1 = require("../wallet/errors");
var method_filter_1 = require("../wallet/method-filter");
var TxParserService = (function () {
    function TxParserService(contractKit) {
        this.contractKit = contractKit;
    }
    TxParserService.prototype.onModuleInit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            return __generator(this, function (_p) {
                switch (_p.label) {
                    case 0:
                        _a = this;
                        _f = (_e = new method_filter_1.MethodFilter()).addContract;
                        _g = [contractkit_1.CeloContract.Attestations];
                        return [4, this.contractKit.contracts.getAttestations()];
                    case 1:
                        _h = (_d = _f.apply(_e, _g.concat([_p.sent(),
                            ["selectIssuers", "complete"]]))).addContract;
                        _j = [contractkit_1.CeloContract.Accounts];
                        return [4, this.contractKit.contracts.getAccounts()];
                    case 2:
                        _k = (_c = _h.apply(_d, _j.concat([_p.sent(),
                            ["setAccount"]]))).addContract;
                        _l = [contractkit_1.CeloContract.StableToken];
                        return [4, this.contractKit.contracts.getStableToken()];
                    case 3:
                        _m = (_b = _k.apply(_c, _l.concat([_p.sent(),
                            ["approve", "transfer"]]))).addContract;
                        _o = [contractkit_1.CeloContract.Escrow];
                        return [4, this.contractKit.contracts.getEscrow()];
                    case 4:
                        _a.defaultFilter = _m.apply(_b, _o.concat([_p.sent(),
                            ["withdraw"]]));
                        return [2];
                }
            });
        });
    };
    TxParserService.prototype.parse = function (tx, metaTxWalletAddress, methodFilter) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, childrenResp, children, _i, _a, child, method;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.contractKit.contracts.getMetaTransactionWallet(metaTxWalletAddress)];
                    case 1:
                        wallet = _b.sent();
                        if (!isCallTo(tx, wallet, 'executeMetaTransaction')) {
                            return [2, base_1.Err(new errors_1.InvalidRootTransaction(tx))];
                        }
                        childrenResp = this.getChildren(tx, wallet);
                        if (childrenResp.ok === false) {
                            return [2, childrenResp];
                        }
                        methodFilter = methodFilter || this.defaultFilter;
                        children = [];
                        for (_i = 0, _a = childrenResp.result; _i < _a.length; _i++) {
                            child = _a[_i];
                            method = methodFilter.find(child);
                            if (method.ok) {
                                children.push(method.result);
                            }
                            else {
                                return [2, base_1.Err(new errors_1.TransactionNotAllowed(child))];
                            }
                        }
                        return [2, base_1.Ok(children)];
                }
            });
        });
    };
    TxParserService.prototype.getChildren = function (tx, wallet) {
        var childResp = decode_txs_1.decodeExecuteMetaTransaction(tx);
        if (childResp.ok === false) {
            return childResp;
        }
        var child = childResp.result;
        if (isCallTo(child, wallet, 'executeTransactions')) {
            return decode_txs_1.decodeExecuteTransactions(child);
        }
        else {
            return base_1.Ok([child]);
        }
    };
    TxParserService = __decorate([
        common_1.Injectable(),
        __metadata("design:paramtypes", [contractkit_1.ContractKit])
    ], TxParserService);
    return TxParserService;
}());
exports.TxParserService = TxParserService;
var isCallTo = function (tx, contract, method) {
    return base_1.normalizeAddress(tx.destination) === base_1.normalizeAddress(contract.address) &&
        core_1.extractMethodId(tx.data) === core_1.normalizeMethodId(contract.methodIds[method]);
};
