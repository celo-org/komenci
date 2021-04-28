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
var result_1 = require("@celo/base/lib/result");
var SubsidyErrorTypes;
(function (SubsidyErrorTypes) {
    SubsidyErrorTypes["WalletSignerMismatchError"] = "WalletSignerMismatchError";
    SubsidyErrorTypes["InvalidMetaTransaction"] = "InvalidMetaTransaction";
})(SubsidyErrorTypes = exports.SubsidyErrorTypes || (exports.SubsidyErrorTypes = {}));
var WalletSignerMismatchError = (function (_super) {
    __extends(WalletSignerMismatchError, _super);
    function WalletSignerMismatchError(expected, session) {
        var _this = _super.call(this, SubsidyErrorTypes.WalletSignerMismatchError) || this;
        _this.message = "Wallet doesn't belong to action initiator (wallet: " + expected + ", session: " + session + ")";
        return _this;
    }
    return WalletSignerMismatchError;
}(result_1.RootError));
exports.WalletSignerMismatchError = WalletSignerMismatchError;
var InvalidMetaTransaction = (function (_super) {
    __extends(InvalidMetaTransaction, _super);
    function InvalidMetaTransaction(context) {
        var _this = _super.call(this, SubsidyErrorTypes.InvalidMetaTransaction) || this;
        _this.context = context;
        _this.message = "Invalid meta transaction received " + context;
        return _this;
    }
    return InvalidMetaTransaction;
}(result_1.RootError));
exports.InvalidMetaTransaction = InvalidMetaTransaction;
