"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var web3_1 = require("web3");
var common_1 = require("@nestjs/common");
var MetaTransactionWalletDeployer_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWallet");
var MetaTransactionWallet_2 = require("@celo/contractkit/lib/generated/MetaTransactionWallet");
var kit_1 = require("@celo/contractkit/lib/kit");
var result_1 = require("@celo/base/lib/result");
var base_1 = require("@celo/base");
var logger_1 = require("@komenci/logger");
var core_1 = require("@komenci/core");
var verifyWallet_1 = require("@komenci/kit/lib/verifyWallet");
var relayer_proxy_service_1 = require("../relayer/relayer_proxy.service");
var session_service_1 = require("../session/session.service");
var errors_1 = require("../wallet/errors");
var app_config_1 = require("../config/app.config");
var WalletService = (function () {
    function WalletService(relayerProxyService, sessionService, walletDeployer, web3, contractKit, networkCfg, appCfg, logger) {
        this.relayerProxyService = relayerProxyService;
        this.sessionService = sessionService;
        this.walletDeployer = walletDeployer;
        this.web3 = web3;
        this.contractKit = contractKit;
        this.networkCfg = networkCfg;
        this.appCfg = appCfg;
        this.logger = logger;
    }
    WalletService.prototype.isValidWallet = function (walletAddress, expectedSigner) {
        return __awaiter(this, void 0, void 0, function () {
            var valid;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, verifyWallet_1.verifyWallet(this.contractKit, walletAddress, Object.keys(this.networkCfg.contracts.MetaTransactionWalletVersions), expectedSigner)];
                    case 1:
                        valid = _a.sent();
                        if (valid.ok !== true) {
                            return [2, result_1.Err(new errors_1.InvalidWallet(valid.error))];
                        }
                        return [2, valid];
                }
            });
        });
    };
    WalletService.prototype.getWallet = function (session, implementationAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var tx, events, deployWalletLog;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.hasDeployInProgress(session, implementationAddress)) return [3, 3];
                        return [4, this.web3.eth.getTransaction(session.meta.walletDeploy.txHash)];
                    case 1:
                        tx = _a.sent();
                        if (!(tx.blockNumber !== null)) return [3, 3];
                        return [4, this.walletDeployer.getPastEvents(this.walletDeployer.eventTypes.WalletDeployed, {
                                fromBlock: tx.blockNumber,
                                toBlock: tx.blockNumber
                            })];
                    case 2:
                        events = _a.sent();
                        deployWalletLog = events.find(function (event) {
                            return base_1.normalizeAddress(event.returnValues.owner) ===
                                base_1.normalizeAddress(session.externalAccount);
                        });
                        if (deployWalletLog) {
                            return [2, result_1.Ok(deployWalletLog.returnValues.wallet)];
                        }
                        _a.label = 3;
                    case 3: return [2, result_1.Err(new errors_1.WalletNotDeployed())];
                }
            });
        });
    };
    WalletService.prototype.deployWallet = function (session, implementationAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var impl, txn, resp, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.isValidImplementation(implementationAddress)) {
                            return [2, result_1.Err(new errors_1.InvalidImplementation(implementationAddress))];
                        }
                        if (this.hasDeployInProgress(session, implementationAddress)) {
                            return [2, result_1.Ok(session.meta.walletDeploy.txHash)];
                        }
                        impl = MetaTransactionWallet_2.newMetaTransactionWallet(this.web3, implementationAddress);
                        txn = MetaTransactionWallet_1.toRawTransaction(this.walletDeployer.deploy(base_1.ensureLeading0x(session.externalAccount), base_1.ensureLeading0x(implementationAddress), impl.methods.initialize(base_1.ensureLeading0x(session.externalAccount)).encodeABI()).txo);
                        _a = base_1.throwIfError;
                        return [4, this.relayerProxyService.submitTransaction({
                                transaction: txn
                            })];
                    case 1:
                        resp = _a.apply(void 0, [_b.sent()]);
                        this.logger.event(logger_1.EventType.DeployWalletTxSent, {
                            txHash: resp.payload,
                            sessionId: session.id,
                            externalAccount: session.externalAccount
                        });
                        return [4, this.sessionService.update(session.id, {
                                meta: __assign(__assign({}, session.meta), { walletDeploy: {
                                        startedAt: Date.now(),
                                        txHash: resp.payload,
                                        implementationAddress: implementationAddress
                                    } })
                            })];
                    case 2:
                        _b.sent();
                        return [2, result_1.Ok(resp.payload)];
                }
            });
        });
    };
    WalletService.prototype.hasDeployInProgress = function (session, implementationAddress) {
        var _a, _b, _c, _d;
        if (((_b = (_a = session.meta) === null || _a === void 0 ? void 0 : _a.walletDeploy) === null || _b === void 0 ? void 0 : _b.txHash) !== undefined &&
            (((_d = (_c = session.meta) === null || _c === void 0 ? void 0 : _c.walletDeploy) === null || _d === void 0 ? void 0 : _d.implementationAddress) === implementationAddress ||
                implementationAddress === undefined)) {
            var deployDeadline = new Date(session.meta.walletDeploy.startedAt +
                this.appCfg.transactionTimeoutMs);
            if (new Date() < deployDeadline) {
                return true;
            }
        }
        return false;
    };
    WalletService.prototype.isValidImplementation = function (implementationAddress) {
        return implementationAddress in this.networkCfg.contracts.MetaTransactionWalletVersions;
    };
    WalletService = __decorate([
        common_1.Injectable({
            scope: common_1.Scope.REQUEST
        }),
        __param(5, common_1.Inject(core_1.networkConfig.KEY)),
        __param(6, common_1.Inject(app_config_1.appConfig.KEY)),
        __metadata("design:paramtypes", [relayer_proxy_service_1.RelayerProxyService,
            session_service_1.SessionService,
            MetaTransactionWalletDeployer_1.MetaTransactionWalletDeployerWrapper,
            web3_1.default,
            kit_1.ContractKit, Object, Object, logger_1.KomenciLoggerService])
    ], WalletService);
    return WalletService;
}());
exports.WalletService = WalletService;
