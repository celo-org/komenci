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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var async_mutex_1 = require("async-mutex");
var bignumber_js_1 = require("bignumber.js");
var web3_1 = require("web3");
var blockchain_service_1 = require("@komenci/blockchain/dist/blockchain.service");
var wallet_config_1 = require("@komenci/blockchain/dist/config/wallet.config");
var logger_1 = require("@komenci/logger");
var result_1 = require("@celo/base/lib/result");
var contractkit_1 = require("@celo/contractkit");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWallet");
var retry_1 = require("@komenci/kit/lib/retry");
var common_1 = require("@nestjs/common");
var balance_service_1 = require("../chain/balance.service");
var errors_1 = require("../chain/errors");
var RawTransactionDto_1 = require("../dto/RawTransactionDto");
var RelayerCommandDto_1 = require("../dto/RelayerCommandDto");
var app_config_1 = require("../config/app.config");
var ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
var GWEI_PER_UNIT = 1e9;
var TxDeadletterReason;
(function (TxDeadletterReason) {
    TxDeadletterReason["GasTooLow"] = "GasTooLow";
    TxDeadletterReason["Expired"] = "Expired";
})(TxDeadletterReason || (TxDeadletterReason = {}));
var TransactionService = (function () {
    function TransactionService(kit, logger, walletCfg, appCfg, blockchainService, balanceService) {
        this.kit = kit;
        this.logger = logger;
        this.walletCfg = walletCfg;
        this.appCfg = appCfg;
        this.blockchainService = blockchainService;
        this.balanceService = balanceService;
        this.watchedTransactions = new Set();
        this.transactions = new Map();
        this.checksumWalletAddress = web3_1.default.utils.toChecksumAddress(walletCfg.address);
        this.nonceLock = new async_mutex_1.Mutex();
        this.gasPrice = new bignumber_js_1.default(this.appCfg.gasPriceFallback);
    }
    TransactionService.prototype.onModuleInit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pendingTxs;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.updateGasPrice()];
                    case 1:
                        _a.sent();
                        return [4, this.updateNonce()];
                    case 2:
                        _a.sent();
                        return [4, this.getPendingTransactions()];
                    case 3:
                        pendingTxs = _a.sent();
                        pendingTxs.forEach(function (_a) {
                            var hash = _a.hash, nonce = _a.nonce, gasPrice = _a.gasPrice;
                            return _this.watchTransaction(hash, {
                                nonce: nonce,
                                gasPrice: gasPrice,
                                expireIn: _this.appCfg.transactionTimeoutMs,
                            });
                        });
                        this.txTimer = setInterval(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                            return [2, this.checkTransactions()];
                        }); }); }, this.appCfg.transactionCheckIntervalMs);
                        this.gasPriceTimer = setInterval(function () { return _this.updateGasPrice(); }, this.appCfg.gasPriceUpdateIntervalMs);
                        return [2];
                }
            });
        });
    };
    TransactionService.prototype.onModuleDestroy = function () {
        clearInterval(this.txTimer);
        clearInterval(this.gasPriceTimer);
    };
    TransactionService.prototype.submitTransaction = function (tx, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            var startedAcquireLock, endedAcquireLock_1, startedSend_1, endedSend_1, _a, txHash, nonce, e_1, err, err;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 8]);
                        startedAcquireLock = Date.now();
                        return [4, this.nonceLock.runExclusive(function () { return __awaiter(_this, void 0, void 0, function () {
                                var _txHash;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            endedAcquireLock_1 = Date.now();
                                            startedSend_1 = Date.now();
                                            return [4, this.sendTransaction(tx, this.gasPrice, this.nonce)];
                                        case 1:
                                            _txHash = _a.sent();
                                            endedSend_1 = Date.now();
                                            return [2, [
                                                    _txHash,
                                                    this.nonce++,
                                                ]];
                                    }
                                });
                            }); })];
                    case 1:
                        _a = __read.apply(void 0, [_b.sent(), 2]), txHash = _a[0], nonce = _a[1];
                        this.watchTransaction(txHash, {
                            nonce: nonce,
                            gasPrice: this.gasPrice,
                            expireIn: this.appCfg.transactionTimeoutMs,
                            traceContext: ctx,
                        });
                        this.logger.event(logger_1.EventType.TxSubmitted, {
                            lockAcquiredDuration: endedAcquireLock_1 - startedAcquireLock,
                            sendDuration: endedSend_1 - startedSend_1,
                            txHash: txHash,
                            gasPrice: this.gasPrice.toFixed(),
                            nonce: nonce,
                            destination: tx.destination
                        }, ctx);
                        return [2, result_1.Ok(txHash)];
                    case 2:
                        e_1 = _b.sent();
                        if (!e_1.message.match(/gasprice is less than gas price minimum/)) return [3, 4];
                        err = new errors_1.GasPriceBellowMinimum(this.gasPrice.toFixed(0));
                        this.logger.warnWithContext(err, ctx);
                        return [4, this.updateGasPrice()];
                    case 3:
                        _b.sent();
                        return [2, result_1.Err(err)];
                    case 4:
                        if (!e_1.message.match(/nonce too low/)) return [3, 6];
                        err = new errors_1.NonceTooLow();
                        this.logger.warnWithContext(err, ctx);
                        return [4, this.updateNonce()];
                    case 5:
                        _b.sent();
                        return [2, result_1.Err(err)];
                    case 6: return [2, result_1.Err(new errors_1.TxSubmitError(e_1, tx))];
                    case 7: return [3, 8];
                    case 8: return [2];
                }
            });
        });
    };
    TransactionService.prototype.submitTransactionObject = function (txo, ctx) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.submitTransaction(MetaTransactionWallet_1.toRawTransaction(txo), ctx)];
            });
        });
    };
    TransactionService.prototype.checkTransactions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var txs, gasTooLow, completed, expired;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getTxSummaries()];
                    case 1:
                        txs = _a.sent();
                        gasTooLow = txs.filter(function (item) { return (_this.hasGasTooLow(item)); });
                        completed = txs.filter(function (item) { return item.tx && item.tx.blockHash !== null; });
                        if (!(completed.length > 0)) return [3, 3];
                        return [4, this.balanceService.logBalance()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        expired = txs.filter(function (item) { return (_this.isExpired(item)); });
                        return [4, Promise.all(gasTooLow.map(function (item) { return _this.deadLetter(item, TxDeadletterReason.GasTooLow); }))];
                    case 4:
                        _a.sent();
                        return [4, Promise.all(expired.map(function (item) { return _this.deadLetter(item, TxDeadletterReason.Expired); }))];
                    case 5:
                        _a.sent();
                        return [4, Promise.all(completed.map(function (item) { return _this.finalizeTransaction(item); }))];
                    case 6:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    TransactionService.prototype.getTxSummaries = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, Promise.all(__spread(this.watchedTransactions).map(function (txHash) { return __awaiter(_this, void 0, void 0, function () {
                        var cachedTxData, transaction, err;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    cachedTxData = this.transactions.get(txHash);
                                    return [4, this.kit.web3.eth.getTransaction(txHash)];
                                case 1:
                                    transaction = _a.sent();
                                    if (transaction === null || transaction === undefined) {
                                        err = new errors_1.TxNotFoundError(txHash);
                                        this.logger.warnWithContext(err, cachedTxData === null || cachedTxData === void 0 ? void 0 : cachedTxData.traceContext);
                                    }
                                    if (cachedTxData === null) {
                                        this.logger.warn(new errors_1.TxNotInCache(txHash));
                                    }
                                    return [2, { hash: txHash, tx: transaction, cachedTx: cachedTxData }];
                            }
                        });
                    }); }))];
            });
        });
    };
    TransactionService.prototype.finalizeTransaction = function (txs) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var ctx, txReceipt, gasPrice;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ctx = (_a = this.transactions.get(txs.hash)) === null || _a === void 0 ? void 0 : _a.traceContext;
                        return [4, this.kit.web3.eth.getTransactionReceipt(txs.hash)];
                    case 1:
                        txReceipt = _b.sent();
                        if (txReceipt === null) {
                            this.logger.warn(new errors_1.ReceiptNotFoundError(txs.hash));
                            return [2];
                        }
                        gasPrice = parseInt(txs.tx.gasPrice, 10);
                        this.unwatchTransaction(txs.tx.hash);
                        this.logger.event(logger_1.EventType.TxConfirmed, {
                            status: txReceipt.status === false ? "Reverted" : "Ok",
                            txHash: txs.tx.hash,
                            nonce: txs.tx.nonce,
                            gasUsed: txReceipt.gasUsed,
                            gasPrice: gasPrice,
                            gasCost: gasPrice * txReceipt.gasUsed,
                            destination: txs.tx.to
                        }, ctx);
                        return [2];
                }
            });
        });
    };
    TransactionService.prototype.deadLetter = function (txs, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var gasPrice, result, deadLetterHash, e_2, err;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        gasPrice = bignumber_js_1.default.max(txs.cachedTx.gasPrice.times(1.4), this.gasPrice);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 9]);
                        return [4, this.kit.sendTransaction({
                                to: this.walletCfg.address,
                                from: this.walletCfg.address,
                                value: '0',
                                nonce: txs.cachedTx.nonce,
                                gasPrice: gasPrice.toFixed(0)
                            })];
                    case 2:
                        result = _a.sent();
                        return [4, result.getHash()];
                    case 3:
                        deadLetterHash = _a.sent();
                        this.unwatchTransaction(txs.hash);
                        this.watchTransaction(deadLetterHash, {
                            nonce: txs.cachedTx.nonce,
                            gasPrice: gasPrice,
                            expireIn: txs.cachedTx.expireIn * 2,
                            traceContext: txs.cachedTx.traceContext
                        });
                        this.logger.event(logger_1.EventType.TxDeadletter, {
                            reason: reason,
                            destination: txs.tx ? txs.tx.to : "n/a",
                            txHash: txs.hash,
                            deadLetterHash: deadLetterHash,
                            nonce: txs.cachedTx.nonce
                        }, txs.cachedTx.traceContext);
                        return [2, result_1.Ok(true)];
                    case 4:
                        e_2 = _a.sent();
                        if (!e_2.message.match(/nonce too low/)) return [3, 5];
                        this.logger.warn("Trying to deadletter a tx that probably when through: " + txs.hash);
                        this.unwatchTransaction(txs.hash);
                        return [2, result_1.Err(new errors_1.NonceTooLow())];
                    case 5:
                        if (!e_2.message.match(/gasprice is less than gas price minimum/)) return [3, 7];
                        this.logger.warn("GasPrice " + gasPrice + " bellow minimum - triggering update");
                        return [4, this.updateGasPrice()];
                    case 6:
                        _a.sent();
                        return [2, result_1.Err(new errors_1.GasPriceBellowMinimum(gasPrice.toFixed(0)))];
                    case 7:
                        err = new errors_1.TxDeadletterError(e_2, txs.hash);
                        this.logger.errorWithContext(err, txs.cachedTx.traceContext);
                        return [2, result_1.Err(err)];
                    case 8: return [3, 9];
                    case 9: return [2];
                }
            });
        });
    };
    TransactionService.prototype.sendTransaction = function (tx, gasPrice, nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.kit.sendTransaction({
                            to: tx.destination,
                            value: tx.value,
                            data: tx.data,
                            from: this.walletCfg.address,
                            gas: this.appCfg.transactionMaxGas,
                            gasPrice: gasPrice.toFixed(0),
                            nonce: nonce
                        })];
                    case 1:
                        result = _a.sent();
                        result.waitReceipt().then().catch(function (e) {
                            _this.logger.warn(e);
                        });
                        return [2, result.getHash()];
                }
            });
        });
    };
    TransactionService.prototype.watchTransaction = function (hash, cachedTx) {
        this.watchedTransactions.add(hash);
        var payload = __assign(__assign({}, cachedTx), { seenAt: Date.now() });
        this.transactions.set(hash, payload);
    };
    TransactionService.prototype.unwatchTransaction = function (txHash) {
        this.watchedTransactions.delete(txHash);
        this.transactions.delete(txHash);
    };
    TransactionService.prototype.isExpired = function (txs) {
        if (txs.tx && txs.tx.blockHash !== null) {
            return false;
        }
        if (txs.cachedTx && txs.cachedTx.seenAt) {
            return (Date.now() - txs.cachedTx.seenAt > txs.cachedTx.expireIn);
        }
        else {
            this.logger.error(new errors_1.TxNotInCache(txs.hash));
            return true;
        }
    };
    TransactionService.prototype.hasGasTooLow = function (txs) {
        if (txs.tx && txs.tx.blockHash !== null) {
            return false;
        }
        if (txs.cachedTx == null) {
            return false;
        }
        return txs.cachedTx.gasPrice.lt(this.gasPrice);
    };
    TransactionService.prototype.getPendingTransactions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var txPoolRes, txPool;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.blockchainService.getPendingTxPool()];
                    case 1:
                        txPoolRes = _a.sent();
                        if (txPoolRes.ok === false) {
                            if (txPoolRes.error.errorType === 'RPC') {
                                this.logger.error(txPoolRes.error);
                            }
                            this.logger.error({
                                message: 'Could not fetch tx pool',
                                originalError: txPoolRes.error
                            });
                            return [2, []];
                        }
                        else if (txPoolRes.ok === true) {
                            txPool = txPoolRes.result;
                            if (this.checksumWalletAddress in txPool.pending) {
                                return [2, Object.values(txPool.pending[this.checksumWalletAddress]).map(function (tx) { return ({ hash: tx.hash, nonce: tx.nonce, gasPrice: new bignumber_js_1.default(tx.gasPrice, 10) }); })];
                            }
                            else {
                                this.logger.log('No pending transactions found for relayer');
                                return [2, []];
                            }
                        }
                        return [2];
                }
            });
        });
    };
    TransactionService.prototype.updateNonce = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, this.nonceLock.runExclusive(function () { return __awaiter(_this, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = this;
                                    return [4, this.kit.connection.nonce(this.walletCfg.address)];
                                case 1:
                                    _a.nonce = _b.sent();
                                    return [2];
                            }
                        });
                    }); })];
            });
        });
    };
    TransactionService.prototype.updateGasPrice = function () {
        return __awaiter(this, void 0, void 0, function () {
            var gasPriceMinimum, rawGasPrice, gasPrice, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, this.kit.contracts.getGasPriceMinimum()];
                    case 1:
                        gasPriceMinimum = _a.sent();
                        return [4, gasPriceMinimum.getGasPriceMinimum(ZERO_ADDRESS)];
                    case 2:
                        rawGasPrice = _a.sent();
                        gasPrice = bignumber_js_1.default.min(rawGasPrice.multipliedBy(this.appCfg.gasPriceMultiplier), this.appCfg.maxGasPrice);
                        this.logger.event(logger_1.EventType.GasPriceUpdate, {
                            gasPriceGwei: parseFloat(this.gasPrice.dividedBy(GWEI_PER_UNIT).toFixed()),
                            cappedAtMax: gasPrice.gte(this.appCfg.maxGasPrice)
                        });
                        this.gasPrice = gasPrice;
                        return [3, 4];
                    case 3:
                        e_3 = _a.sent();
                        this.logger.error(new errors_1.GasPriceFetchError(e_3));
                        if (this.gasPrice.isZero()) {
                            this.gasPrice = new bignumber_js_1.default(this.appCfg.gasPriceFallback, 10);
                        }
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    __decorate([
        retry_1.retry({
            tries: 3
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [RawTransactionDto_1.RawTransactionDto,
            RelayerCommandDto_1.RelayerTraceContext]),
        __metadata("design:returntype", Promise)
    ], TransactionService.prototype, "submitTransaction", null);
    __decorate([
        retry_1.retry({
            tries: 3,
            bailOnErrorTypes: [errors_1.ChainErrorTypes.NonceTooLow]
        }),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, String]),
        __metadata("design:returntype", Promise)
    ], TransactionService.prototype, "deadLetter", null);
    TransactionService = __decorate([
        common_1.Injectable(),
        __param(2, common_1.Inject(wallet_config_1.walletConfig.KEY)),
        __param(3, common_1.Inject(app_config_1.appConfig.KEY)),
        __metadata("design:paramtypes", [contractkit_1.ContractKit,
            logger_1.KomenciLoggerService, Object, Object, blockchain_service_1.BlockchainService,
            balance_service_1.BalanceService])
    ], TransactionService);
    return TransactionService;
}());
exports.TransactionService = TransactionService;
