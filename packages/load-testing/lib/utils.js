"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForReceipt = exports.getAddressFromDeploy = exports.getLoginSignature = void 0;
var tslib_1 = require("tslib");
var address_1 = require("@celo/base/lib/address");
var result_1 = require("@celo/base/lib/result");
var signatureUtils_1 = require("@celo/base/lib/signatureUtils");
var async_1 = require("@celo/utils/lib/async");
var errors_1 = require("@komenci/kit/lib/errors");
var login_1 = require("@komenci/kit/lib/login");
function getLoginSignature(contractKit, account, captchaToken) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var loginStruct, signature, e_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    loginStruct = login_1.buildLoginTypedData(address_1.normalizeAddressWith0x(account), captchaToken);
                    return [4 /*yield*/, contractKit.signTypedData(account, loginStruct)];
                case 1:
                    signature = _a.sent();
                    return [2 /*return*/, result_1.Ok(signatureUtils_1.serializeSignature(signature))];
                case 2:
                    e_1 = _a.sent();
                    return [2 /*return*/, result_1.Err(new errors_1.LoginSignatureError(e_1))];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getLoginSignature = getLoginSignature;
function getAddressFromDeploy(contractKit, externalAccount, txHash) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var receiptResult, receipt, deployer, events, deployWalletLog;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, waitForReceipt(contractKit, txHash)];
                case 1:
                    receiptResult = _a.sent();
                    if (!receiptResult.ok) {
                        return [2 /*return*/, receiptResult];
                    }
                    receipt = receiptResult.result;
                    return [4 /*yield*/, contractKit.contracts.getMetaTransactionWalletDeployer(receipt.to)];
                case 2:
                    deployer = _a.sent();
                    return [4 /*yield*/, deployer.getPastEvents(deployer.eventTypes.WalletDeployed, {
                            fromBlock: receipt.blockNumber,
                            toBlock: receipt.blockNumber,
                        })];
                case 3:
                    events = _a.sent();
                    deployWalletLog = events.find(function (event) { return address_1.normalizeAddressWith0x(event.returnValues.owner) === externalAccount; });
                    if (deployWalletLog === undefined) {
                        return [2 /*return*/, result_1.Err(new errors_1.TxEventNotFound(txHash, deployer.eventTypes.WalletDeployed))];
                    }
                    return [2 /*return*/, result_1.Ok(deployWalletLog.returnValues.wallet)];
            }
        });
    });
}
exports.getAddressFromDeploy = getAddressFromDeploy;
function waitForReceipt(contractKit, txHash) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var receipt, waited;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    receipt = null;
                    waited = 0;
                    _a.label = 1;
                case 1:
                    if (!(receipt == null && waited < 60000)) return [3 /*break*/, 5];
                    return [4 /*yield*/, contractKit.connection.getTransactionReceipt(txHash)];
                case 2:
                    receipt = _a.sent();
                    if (!(receipt == null)) return [3 /*break*/, 4];
                    return [4 /*yield*/, async_1.sleep(100)];
                case 3:
                    _a.sent();
                    waited += 100;
                    _a.label = 4;
                case 4: return [3 /*break*/, 1];
                case 5:
                    if (receipt == null) {
                        return [2 /*return*/, result_1.Err(new errors_1.TxTimeoutError())];
                    }
                    if (!receipt.status) {
                        // TODO: Possible to extract reason?
                        return [2 /*return*/, result_1.Err(new errors_1.TxRevertError(txHash, ''))];
                    }
                    return [2 /*return*/, result_1.Ok(receipt)];
            }
        });
    });
}
exports.waitForReceipt = waitForReceipt;
