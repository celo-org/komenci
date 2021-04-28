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
var base_1 = require("@celo/base");
var contractkit_1 = require("@celo/contractkit");
var logger_1 = require("@komenci/logger");
var throttler_1 = require("@komenci/throttler");
var wallet_service_1 = require("./wallet/wallet.service");
var core_1 = require("@komenci/core");
var quota_config_1 = require("./config/quota.config");
var DeployWalletDto_1 = require("./dto/DeployWalletDto");
var RequestAttestationsDto_1 = require("./dto/RequestAttestationsDto");
var SubmitMetaTransactionDto_1 = require("./dto/SubmitMetaTransactionDto");
var quota_decorator_1 = require("./session/quota.decorator");
var quota_guard_1 = require("./session/quota.guard");
var session_entity_1 = require("./session/session.entity");
var subsidy_service_1 = require("./subsidy/subsidy.service");
var errors_1 = require("./wallet/errors");
var tx_parser_service_1 = require("./wallet/tx-parser.service");
var common_1 = require("@nestjs/common");
var passport_1 = require("@nestjs/passport");
var relayer_proxy_service_1 = require("./relayer/relayer_proxy.service");
var session_service_1 = require("./session/session.service");
var auth_service_1 = require("./auth/auth.service");
var app_config_1 = require("./config/app.config");
var DistributedBlindedPepperDto_1 = require("./dto/DistributedBlindedPepperDto");
var StartSessionDto_1 = require("./dto/StartSessionDto");
var gateway_service_1 = require("./gateway/gateway.service");
var AppController = (function () {
    function AppController(relayerProxyService, gatewayService, authService, subsidyService, sessionService, walletService, contractKit, networkCfg, appCfg, logger, txParserService) {
        this.relayerProxyService = relayerProxyService;
        this.gatewayService = gatewayService;
        this.authService = authService;
        this.subsidyService = subsidyService;
        this.sessionService = sessionService;
        this.walletService = walletService;
        this.contractKit = contractKit;
        this.networkCfg = networkCfg;
        this.appCfg = appCfg;
        this.logger = logger;
        this.txParserService = txParserService;
    }
    AppController.prototype.health = function (req) {
        return {
            status: 'OK'
        };
    };
    AppController.prototype.ready = function () {
        return {
            status: 'Ready'
        };
    };
    AppController.prototype.startSession = function (startSessionDto, req) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.gatewayService.verify(startSessionDto, req)];
                    case 1:
                        if (!((_a.sent()) === true)) return [3, 3];
                        return [4, this.authService.startSession(startSessionDto.externalAccount)];
                    case 2:
                        response = _a.sent();
                        this.logger.event(logger_1.EventType.SessionStart, {
                            externalAccount: base_1.trimLeading0x(startSessionDto.externalAccount),
                            sessionId: response.sessionId
                        });
                        return [2, { token: response.token, callbackUrl: this.appCfg.callbackUrl }];
                    case 3: throw new common_1.UnauthorizedException();
                }
            });
        });
    };
    AppController.prototype.checkSession = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var getResp, walletAddress;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.walletService.getWallet(session)];
                    case 1:
                        getResp = _a.sent();
                        if (getResp.ok) {
                            walletAddress = getResp.result;
                        }
                        return [2, {
                                quotaLeft: this.sessionService.quotaLeft(session),
                                metaTxWalletAddress: walletAddress
                            }];
                }
            });
        });
    };
    AppController.prototype.deployWallet = function (deployWalletDto, session) {
        return __awaiter(this, void 0, void 0, function () {
            var getResp, txHash, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.walletService.getWallet(session, deployWalletDto.implementationAddress)];
                    case 1:
                        getResp = _b.sent();
                        if (getResp.ok === true) {
                            return [2, {
                                    status: 'deployed',
                                    walletAddress: getResp.result
                                }];
                        }
                        if (getResp.error.errorType !== errors_1.WalletErrorType.NotDeployed) {
                            throw getResp.error;
                        }
                        _a = base_1.throwIfError;
                        return [4, this.walletService.deployWallet(session, deployWalletDto.implementationAddress)];
                    case 2:
                        txHash = _a.apply(void 0, [_b.sent()]);
                        return [2, {
                                status: 'in-progress',
                                txHash: txHash,
                                deployerAddress: this.networkCfg.contracts.MetaTransactionWalletDeployer
                            }];
                }
            });
        });
    };
    AppController.prototype.distributedBlindedPepper = function (distributedBlindedPepperDto, session) {
        return __awaiter(this, void 0, void 0, function () {
            var resp, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = base_1.throwIfError;
                        return [4, this.relayerProxyService.getPhoneNumberIdentifier(distributedBlindedPepperDto)];
                    case 1:
                        resp = _a.apply(void 0, [_b.sent()]);
                        this.logger.event(logger_1.EventType.PepperRequested, {
                            sessionId: session.id,
                            externalAccount: session.externalAccount,
                            blindedPhoneNumber: distributedBlindedPepperDto.blindedPhoneNumber,
                            clientVersion: distributedBlindedPepperDto.clientVersion,
                            relayerAddress: resp.relayerAddress
                        });
                        return [4, this.sessionService.incrementUsage(session, quota_config_1.TrackedAction.DistributedBlindedPepper)];
                    case 2:
                        _b.sent();
                        return [2, {
                                combinedSignature: resp.payload
                            }];
                }
            });
        });
    };
    AppController.prototype.requestSubsidisedAttestations = function (requestAttestationsDto, session) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, transactions, txSubmit, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = base_1.throwIfError;
                        return [4, this.subsidyService.isValid(requestAttestationsDto, session)];
                    case 1:
                        _a.apply(void 0, [_c.sent()]);
                        return [4, this.subsidyService.buildTransactionBatch(requestAttestationsDto)];
                    case 2:
                        transactions = _c.sent();
                        _b = base_1.throwIfError;
                        return [4, this.relayerProxyService.submitTransactionBatch({
                                transactions: transactions
                            })];
                    case 3:
                        txSubmit = _b.apply(void 0, [_c.sent()]);
                        this.logger.event(logger_1.EventType.AttestationsRequested, {
                            sessionId: session.id,
                            externalAccount: session.externalAccount,
                            txHash: txSubmit.payload,
                            relayerAddress: txSubmit.relayerAddress,
                            attestationsRequested: requestAttestationsDto.attestationsRequested,
                            identifier: requestAttestationsDto.identifier
                        });
                        return [4, this.sessionService.incrementUsage(session, quota_config_1.TrackedAction.RequestSubsidisedAttestation, requestAttestationsDto.attestationsRequested)];
                    case 4:
                        _c.sent();
                        return [2, {
                                txHash: txSubmit.payload
                            }];
                }
            });
        });
    };
    AppController.prototype.submitMetaTransaction = function (body, session) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, metaTx, childTxs, _b, resp, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = base_1.throwIfError;
                        return [4, this.walletService.isValidWallet(body.destination, session.externalAccount)];
                    case 1:
                        _a.apply(void 0, [_d.sent()]);
                        metaTx = __assign(__assign({}, body), { value: '0x0' });
                        _b = base_1.throwIfError;
                        return [4, this.txParserService.parse(metaTx, body.destination)];
                    case 2:
                        childTxs = _b.apply(void 0, [_d.sent()]);
                        _c = base_1.throwIfError;
                        return [4, this.relayerProxyService.submitTransaction({
                                transaction: metaTx
                            })];
                    case 3:
                        resp = _c.apply(void 0, [_d.sent()]);
                        this.logMetaTransaction(resp, metaTx, childTxs, session);
                        return [4, this.sessionService.incrementUsage(session, quota_config_1.TrackedAction.SubmitMetaTransaction)];
                    case 4:
                        _d.sent();
                        return [2, {
                                txHash: resp.payload
                            }];
                }
            });
        });
    };
    AppController.prototype.logMetaTransaction = function (relayerResp, metaTx, childTxs, session) {
        var _this = this;
        this.logger.event(logger_1.EventType.MetaTransactionSubmitted, {
            sessionId: session.id,
            relayerAddress: relayerResp.relayerAddress,
            externalAccount: session.externalAccount,
            txHash: relayerResp.payload,
            destination: base_1.normalizeAddress(metaTx.destination),
            childTxsCount: childTxs.length
        });
        childTxs.map(function (childTx) { return ({
            value: childTx.raw.value,
            destination: childTx.raw.destination,
            methodId: childTx.methodId,
            methodName: childTx.methodName,
            contractName: childTx.contractName
        }); }).forEach(function (childTx) { return _this.logger.event(logger_1.EventType.ChildMetaTransactionSubmitted, __assign({ sessionId: session.id, relayerAddress: relayerResp.relayerAddress, externalAccount: session.externalAccount, txHash: relayerResp.payload }, childTx)); });
    };
    __decorate([
        common_1.Get('health'),
        __param(0, common_1.Req()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Object)
    ], AppController.prototype, "health", null);
    __decorate([
        throttler_1.Throttle({
            key: 'start-session',
            checkOnly: true
        }),
        common_1.UseGuards(throttler_1.ThrottlerGuard),
        common_1.Get('ready'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", Object)
    ], AppController.prototype, "ready", null);
    __decorate([
        throttler_1.Throttle({
            key: 'start-session',
        }),
        common_1.UseGuards(throttler_1.ThrottlerGuard),
        common_1.Post('startSession'),
        __param(0, common_1.Body()),
        __param(1, common_1.Req()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [StartSessionDto_1.StartSessionDto, Object]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "startSession", null);
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt')),
        common_1.Get('checkSession'),
        __param(0, common_1.Session()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [session_entity_1.Session]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "checkSession", null);
    __decorate([
        common_1.UseGuards(passport_1.AuthGuard('jwt')),
        common_1.Post('deployWallet'),
        __param(0, common_1.Body()),
        __param(1, common_1.Session()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [DeployWalletDto_1.DeployWalletDto,
            session_entity_1.Session]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "deployWallet", null);
    __decorate([
        quota_decorator_1.QuotaAction(quota_config_1.TrackedAction.DistributedBlindedPepper),
        common_1.UseGuards(passport_1.AuthGuard('jwt'), quota_guard_1.QuotaGuard),
        common_1.Post('distributedBlindedPepper'),
        __param(0, common_1.Body()),
        __param(1, common_1.Session()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [DistributedBlindedPepperDto_1.DistributedBlindedPepperDto,
            session_entity_1.Session]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "distributedBlindedPepper", null);
    __decorate([
        quota_decorator_1.QuotaAction(quota_config_1.TrackedAction.RequestSubsidisedAttestation),
        common_1.UseGuards(passport_1.AuthGuard('jwt'), quota_guard_1.QuotaGuard),
        common_1.Post('requestSubsidisedAttestations'),
        __param(0, common_1.Body()),
        __param(1, common_1.Session()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [RequestAttestationsDto_1.RequestAttestationsDto,
            session_entity_1.Session]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "requestSubsidisedAttestations", null);
    __decorate([
        quota_decorator_1.QuotaAction(quota_config_1.TrackedAction.SubmitMetaTransaction),
        common_1.UseGuards(passport_1.AuthGuard('jwt'), quota_guard_1.QuotaGuard),
        common_1.Post('submitMetaTransaction'),
        __param(0, common_1.Body()),
        __param(1, common_1.Session()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [SubmitMetaTransactionDto_1.SubmitMetaTransactionDto,
            session_entity_1.Session]),
        __metadata("design:returntype", Promise)
    ], AppController.prototype, "submitMetaTransaction", null);
    AppController = __decorate([
        common_1.Controller({
            path: "v1",
            scope: common_1.Scope.REQUEST
        }),
        __param(7, common_1.Inject(core_1.networkConfig.KEY)),
        __param(8, common_1.Inject(app_config_1.appConfig.KEY)),
        __metadata("design:paramtypes", [relayer_proxy_service_1.RelayerProxyService,
            gateway_service_1.GatewayService,
            auth_service_1.AuthService,
            subsidy_service_1.SubsidyService,
            session_service_1.SessionService,
            wallet_service_1.WalletService,
            contractkit_1.ContractKit, Object, Object, logger_1.KomenciLoggerService,
            tx_parser_service_1.TxParserService])
    ], AppController);
    return AppController;
}());
exports.AppController = AppController;
