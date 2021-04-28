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
var core_1 = require("@komenci/core");
var result_1 = require("@celo/base/lib/result");
var WalletErrorType;
(function (WalletErrorType) {
    WalletErrorType["NotDeployed"] = "NotDeployed";
    WalletErrorType["InvalidImplementation"] = "InvalidImplementation";
    WalletErrorType["InvalidWallet"] = "InvalidWallet";
})(WalletErrorType = exports.WalletErrorType || (exports.WalletErrorType = {}));
var WalletNotDeployed = (function (_super) {
    __extends(WalletNotDeployed, _super);
    function WalletNotDeployed() {
        return _super.call(this, WalletErrorType.NotDeployed) || this;
    }
    return WalletNotDeployed;
}(result_1.RootError));
exports.WalletNotDeployed = WalletNotDeployed;
var InvalidImplementation = (function (_super) {
    __extends(InvalidImplementation, _super);
    function InvalidImplementation(address) {
        var _this = _super.call(this, WalletErrorType.InvalidImplementation) || this;
        _this.address = address;
        _this.statusCode = 400;
        _this.metadataProps = ['address'];
        _this.message = "Unexpected MetaTransactionWallet implementation address";
        return _this;
    }
    return InvalidImplementation;
}(core_1.ApiError));
exports.InvalidImplementation = InvalidImplementation;
var InvalidWallet = (function (_super) {
    __extends(InvalidWallet, _super);
    function InvalidWallet(reason) {
        var _this = _super.call(this, WalletErrorType.InvalidWallet) || this;
        _this.reason = reason;
        _this.statusCode = 400;
        _this.metadataProps = ['reason'];
        _this.message = "Invalid wallet";
        return _this;
    }
    return InvalidWallet;
}(core_1.ApiError));
exports.InvalidWallet = InvalidWallet;
var TxParseErrorTypes;
(function (TxParseErrorTypes) {
    TxParseErrorTypes["InvalidRootTransaction"] = "MetaTx.InvalidRootTransaction";
    TxParseErrorTypes["TransactionNotAllowed"] = "MetaTx.TransactionNotAllowed";
    TxParseErrorTypes["TransactionDecodeError"] = "MetaTx.TransactionDecodeError";
})(TxParseErrorTypes = exports.TxParseErrorTypes || (exports.TxParseErrorTypes = {}));
var InvalidRootTransaction = (function (_super) {
    __extends(InvalidRootTransaction, _super);
    function InvalidRootTransaction(tx) {
        var _this = _super.call(this, TxParseErrorTypes.InvalidRootTransaction) || this;
        _this.tx = tx;
        _this.statusCode = 400;
        _this.metadataProps = ['tx'];
        return _this;
    }
    return InvalidRootTransaction;
}(core_1.ApiError));
exports.InvalidRootTransaction = InvalidRootTransaction;
var TransactionNotAllowed = (function (_super) {
    __extends(TransactionNotAllowed, _super);
    function TransactionNotAllowed(tx) {
        var _this = _super.call(this, TxParseErrorTypes.TransactionNotAllowed) || this;
        _this.tx = tx;
        _this.statusCode = 400;
        _this.metadataProps = ['tx'];
        return _this;
    }
    return TransactionNotAllowed;
}(core_1.ApiError));
exports.TransactionNotAllowed = TransactionNotAllowed;
var TransactionDecodeError = (function (_super) {
    __extends(TransactionDecodeError, _super);
    function TransactionDecodeError(tx, error) {
        var _this = _super.call(this, TxParseErrorTypes.TransactionDecodeError) || this;
        _this.tx = tx;
        _this.error = error;
        _this.statusCode = 400;
        _this.metadataProps = ['tx'];
        _this.message = error.message;
        return _this;
    }
    return TransactionDecodeError;
}(core_1.ApiError));
exports.TransactionDecodeError = TransactionDecodeError;
