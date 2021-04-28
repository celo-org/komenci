"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var logger_1 = require("@komenci/logger");
var core_1 = require("@komenci/core");
var result_1 = require("@celo/base/lib/result");
var contractkit_1 = require("@celo/contractkit");
var identity_1 = require("@celo/identity");
var retry_1 = require("@komenci/kit/lib/retry");
var common_1 = require("@nestjs/common");
var app_config_1 = require("../config/app.config");
var GetPhoneNumberSignatureDto_1 = require("../dto/GetPhoneNumberSignatureDto");
var OdisQueryErrorTypes;
(function (OdisQueryErrorTypes) {
    OdisQueryErrorTypes["OutOfQuota"] = "OutOfQuota";
    OdisQueryErrorTypes["Timeout"] = "Timeout";
    OdisQueryErrorTypes["Unknown"] = "Unknown";
})(OdisQueryErrorTypes = exports.OdisQueryErrorTypes || (exports.OdisQueryErrorTypes = {}));
var OdisOutOfQuotaError = (function (_super) {
    __extends(OdisOutOfQuotaError, _super);
    function OdisOutOfQuotaError() {
        return _super.call(this, OdisQueryErrorTypes.OutOfQuota) || this;
    }
    return OdisOutOfQuotaError;
}(result_1.RootError));
exports.OdisOutOfQuotaError = OdisOutOfQuotaError;
var OdisUnknownError = (function (_super) {
    __extends(OdisUnknownError, _super);
    function OdisUnknownError(odisError) {
        var _this = _super.call(this, OdisQueryErrorTypes.Unknown) || this;
        _this.odisError = odisError;
        return _this;
    }
    return OdisUnknownError;
}(result_1.RootError));
exports.OdisUnknownError = OdisUnknownError;
var OdisTimeoutError = (function (_super) {
    __extends(OdisTimeoutError, _super);
    function OdisTimeoutError() {
        return _super.call(this, OdisQueryErrorTypes.Timeout) || this;
    }
    return OdisTimeoutError;
}(result_1.RootError));
exports.OdisTimeoutError = OdisTimeoutError;
var OdisService = (function () {
    function OdisService(contractKit, walletCfg, networkCfg, appCfg, logger) {
        this.contractKit = contractKit;
        this.walletCfg = walletCfg;
        this.networkCfg = networkCfg;
        this.appCfg = appCfg;
        this.logger = logger;
        this.authSigner = {
            authenticationMethod: identity_1.OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
            contractKit: this.contractKit
        };
        this.serviceContext = {
            odisUrl: this.networkCfg.odis.url,
            odisPubKey: this.networkCfg.odis.publicKey
        };
    }
    OdisService.prototype.getPhoneNumberSignature = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var timeout, res, goldToken, selfTransferTx;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timeout = new Promise(function (resolve) { return setTimeout(function () { return resolve(result_1.Err(new OdisTimeoutError())); }, _this.appCfg.odisTimeoutMs); });
                        return [4, Promise.race([
                                this.queryOdis(input),
                                timeout
                            ])];
                    case 1:
                        res = _a.sent();
                        if (!(res.ok === false)) return [3, 4];
                        this.logger.errorWithContext(res.error, input.context);
                        if (!(res.error.errorType === OdisQueryErrorTypes.OutOfQuota)) return [3, 4];
                        return [4, this.contractKit.contracts.getGoldToken()];
                    case 2:
                        goldToken = _a.sent();
                        selfTransferTx = goldToken.transfer(this.walletCfg.address, 1);
                        return [4, selfTransferTx.sendAndWaitForReceipt({ from: this.walletCfg.address })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2, res];
                }
            });
        });
    };
    OdisService.prototype.queryOdis = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var signature, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, identity_1.OdisUtils.PhoneNumberIdentifier.getBlindedPhoneNumberSignature(this.walletCfg.address, this.authSigner, this.serviceContext, input.blindedPhoneNumber, undefined, input.clientVersion)];
                    case 1:
                        signature = _a.sent();
                        return [2, result_1.Ok(signature)];
                    case 2:
                        e_1 = _a.sent();
                        if (e_1.message.includes('odisQuotaError')) {
                            return [2, result_1.Err(new OdisOutOfQuotaError())];
                        }
                        else {
                            return [2, result_1.Err(new OdisUnknownError(e_1))];
                        }
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    __decorate([
        retry_1.retry({
            bailOnErrorTypes: [
                OdisQueryErrorTypes.Unknown
            ],
            tries: 2,
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [GetPhoneNumberSignatureDto_1.GetPhoneNumberSignatureDto]),
        __metadata("design:returntype", Promise)
    ], OdisService.prototype, "getPhoneNumberSignature", null);
    OdisService = __decorate([
        common_1.Injectable(),
        __param(1, common_1.Inject(wallet_config_1.walletConfig.KEY)),
        __param(2, common_1.Inject(core_1.networkConfig.KEY)),
        __param(3, common_1.Inject(app_config_1.appConfig.KEY)),
        __metadata("design:paramtypes", [contractkit_1.ContractKit, Object, Object, Object, logger_1.KomenciLoggerService])
    ], OdisService);
    return OdisService;
}());
exports.OdisService = OdisService;
