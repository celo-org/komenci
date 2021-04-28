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
Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = require("@celo/base");
var core_1 = require("@komenci/core");
var ChainErrorTypes;
(function (ChainErrorTypes) {
    ChainErrorTypes["TxSubmitError"] = "TxSubmitError";
    ChainErrorTypes["TxNotFoundError"] = "TxNotFoundError";
    ChainErrorTypes["ReceiptNotFoundError"] = "ReceiptNotFoundError";
    ChainErrorTypes["TxDeadletterError"] = "TxDeadletterError";
    ChainErrorTypes["GasPriceFetchError"] = "GasPriceFetchError";
    ChainErrorTypes["NonceTooLow"] = "NonceTooLow";
    ChainErrorTypes["GasPriceBellowMinimum"] = "GasPriceBellowMinimum";
    ChainErrorTypes["TxNotInCache"] = "TxNotInCache";
})(ChainErrorTypes = exports.ChainErrorTypes || (exports.ChainErrorTypes = {}));
var TxSubmitError = (function (_super) {
    __extends(TxSubmitError, _super);
    function TxSubmitError(err, tx) {
        var _this = _super.call(this, ChainErrorTypes.TxSubmitError) || this;
        _this.err = err;
        _this.tx = tx;
        _this.metadataProps = ['tx'];
        _this.message = "TxSubmitError: " + err.message;
        return _this;
    }
    return TxSubmitError;
}(core_1.MetadataError));
exports.TxSubmitError = TxSubmitError;
var TxDeadletterError = (function (_super) {
    __extends(TxDeadletterError, _super);
    function TxDeadletterError(err, txHash) {
        var _this = _super.call(this, ChainErrorTypes.TxDeadletterError) || this;
        _this.err = err;
        _this.txHash = txHash;
        _this.metadataProps = ['txHash'];
        _this.message = "TxDeadletterError: " + err.message;
        return _this;
    }
    return TxDeadletterError;
}(core_1.MetadataError));
exports.TxDeadletterError = TxDeadletterError;
var GasPriceFetchError = (function (_super) {
    __extends(GasPriceFetchError, _super);
    function GasPriceFetchError(err) {
        var _this = _super.call(this, ChainErrorTypes.GasPriceFetchError) || this;
        _this.err = err;
        _this.message = "GasPriceFetchError: " + err.message;
        return _this;
    }
    return GasPriceFetchError;
}(base_1.RootError));
exports.GasPriceFetchError = GasPriceFetchError;
var TxNotFoundError = (function (_super) {
    __extends(TxNotFoundError, _super);
    function TxNotFoundError(txHash) {
        var _this = _super.call(this, ChainErrorTypes.TxNotFoundError) || this;
        _this.txHash = txHash;
        _this.metadataProps = ['txHash'];
        _this.message = "TxNotFoundError: " + txHash + " not found in node";
        return _this;
    }
    return TxNotFoundError;
}(base_1.RootError));
exports.TxNotFoundError = TxNotFoundError;
var ReceiptNotFoundError = (function (_super) {
    __extends(ReceiptNotFoundError, _super);
    function ReceiptNotFoundError(txHash) {
        var _this = _super.call(this, ChainErrorTypes.ReceiptNotFoundError) || this;
        _this.txHash = txHash;
        _this.metadataProps = ['txHash'];
        _this.message = "Receipt not found for " + txHash;
        return _this;
    }
    return ReceiptNotFoundError;
}(base_1.RootError));
exports.ReceiptNotFoundError = ReceiptNotFoundError;
var NonceTooLow = (function (_super) {
    __extends(NonceTooLow, _super);
    function NonceTooLow() {
        var _this = _super.call(this, ChainErrorTypes.NonceTooLow) || this;
        _this.message = "Nonce too low";
        return _this;
    }
    return NonceTooLow;
}(base_1.RootError));
exports.NonceTooLow = NonceTooLow;
var GasPriceBellowMinimum = (function (_super) {
    __extends(GasPriceBellowMinimum, _super);
    function GasPriceBellowMinimum(gasPrice) {
        var _this = _super.call(this, ChainErrorTypes.GasPriceBellowMinimum) || this;
        _this.gasPrice = gasPrice;
        _this.metadataProps = ['gasPrice'];
        _this.message = "Gas price bellow minium: " + gasPrice;
        return _this;
    }
    return GasPriceBellowMinimum;
}(base_1.RootError));
exports.GasPriceBellowMinimum = GasPriceBellowMinimum;
var TxNotInCache = (function (_super) {
    __extends(TxNotInCache, _super);
    function TxNotInCache(txHash) {
        var _this = _super.call(this, ChainErrorTypes.TxNotInCache) || this;
        _this.txHash = txHash;
        _this.metadataProps = ['txHash'];
        _this.message = "TxNotInCache: " + txHash + " not found in cache";
        return _this;
    }
    return TxNotInCache;
}(base_1.RootError));
exports.TxNotInCache = TxNotInCache;
