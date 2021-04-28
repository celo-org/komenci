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
var wallet_config_1 = require("@komenci/blockchain/dist/config/wallet.config");
var rpc_error_filter_1 = require("@komenci/logger/dist/filters/rpc-error.filter");
var result_1 = require("@celo/base/lib/result");
var contractkit_1 = require("@celo/contractkit");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWallet");
var common_1 = require("@nestjs/common");
var microservices_1 = require("@nestjs/microservices");
var transaction_service_1 = require("./chain/transaction.service");
var GetPhoneNumberSignatureDto_1 = require("./dto/GetPhoneNumberSignatureDto");
var SignPersonalMessageDto_1 = require("./dto/SignPersonalMessageDto");
var SubmitTransactionBatchDto_1 = require("./dto/SubmitTransactionBatchDto");
var SubmitTransactionDto_1 = require("./dto/SubmitTransactionDto");
var odis_service_1 = require("./odis/odis.service");
var web3_1 = require("web3");
var RelayerCmd;
(function (RelayerCmd) {
    RelayerCmd["SignPersonalMessage"] = "signPersonalMessage";
    RelayerCmd["GetPhoneNumberIdentifier"] = "getPhoneNumberIdentifier";
    RelayerCmd["SubmitTransaction"] = "submitTransaction";
    RelayerCmd["SubmitTransactionBatch"] = "submitTransactionBatch";
})(RelayerCmd = exports.RelayerCmd || (exports.RelayerCmd = {}));
var AppController = (function () {
    function AppController(odisService, web3, contractKit, walletCfg, metaTxWallet, transactionService) {
        this.odisService = odisService;
        this.web3 = web3;
        this.contractKit = contractKit;
        this.walletCfg = walletCfg;
        this.metaTxWallet = metaTxWallet;
        this.transactionService = transactionService;
    }
    AppController.prototype.signPersonalMessage = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.wrapResponse;
                        return [4, this.web3.eth.sign(input.data, this.walletCfg.address)];
                    case 1: return [2, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    AppController.prototype.getPhoneNumberIdentifier = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.wrapResponse;
                        return [4, result_1.makeAsyncThrowable(this.odisService.getPhoneNumberSignature)(input)];
                    case 1: return [2, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    AppController.prototype.submitTransaction = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.wrapResponse;
                        return [4, result_1.makeAsyncThrowable(this.transactionService.submitTransaction)(input.transaction, input.context)];
                    case 1: return [2, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    AppController.prototype.submitTransactionBatch = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.wrapResponse;
                        return [4, result_1.makeAsyncThrowable(this.transactionService.submitTransaction)(MetaTransactionWallet_1.toRawTransaction(this.metaTxWallet.executeTransactions(input.transactions).txo), input.context)];
                    case 1: return [2, _a.apply(this, [_b.sent()])];
                }
            });
        });
    };
    AppController.prototype.wrapResponse = function (payload) {
        return {
            payload: payload,
            relayerAddress: this.walletCfg.address
        };
    };
    __decorate([
        microservices_1.MessagePattern({ cmd: RelayerCmd.SignPersonalMessage }),
        __param(0, common_1.Body()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [SignPersonalMessageDto_1.SignPersonalMessageDto]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "signPersonalMessage", null);
    __decorate([
        microservices_1.MessagePattern({ cmd: RelayerCmd.GetPhoneNumberIdentifier }),
        __param(0, common_1.Body()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [GetPhoneNumberSignatureDto_1.GetPhoneNumberSignatureDto]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "getPhoneNumberIdentifier", null);
    __decorate([
        microservices_1.MessagePattern({ cmd: RelayerCmd.SubmitTransaction }),
        __param(0, common_1.Body()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [SubmitTransactionDto_1.SubmitTransactionDto]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "submitTransaction", null);
    __decorate([
        microservices_1.MessagePattern({ cmd: RelayerCmd.SubmitTransactionBatch }),
        __param(0, common_1.Body()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [SubmitTransactionBatchDto_1.SubmitTransactionBatchDto]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "submitTransactionBatch", null);
    AppController = __decorate([
        common_1.Controller(),
        common_1.UseFilters(rpc_error_filter_1.RpcErrorFilter),
        __param(3, common_1.Inject(wallet_config_1.walletConfig.KEY)),
        __metadata("design:paramtypes", [odis_service_1.OdisService,
            web3_1.default,
            contractkit_1.ContractKit, Object, MetaTransactionWallet_1.MetaTransactionWalletWrapper,
            transaction_service_1.TransactionService])
    ], AppController);
    return AppController;
}());
exports.AppController = AppController;
