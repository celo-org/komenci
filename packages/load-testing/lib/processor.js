"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.countSelectIssuersTry = exports.countRequestAttestationTry = exports.countSetAccountTry = exports.countWalletTry = exports.startSessionRateLimited = exports.saveStartSessionStatus = exports.latestTxNotConfirmed = exports.walletNotDeployed = exports.getWallet = exports.waitForTransaction = exports.logHeaders = exports.prepareSelectIssuers = exports.prepareSubsidisedAttestations = exports.waitForWallet = exports.resetRetryCounter = exports.prepareSetAccount = exports.recordPepperAndIdentifier = exports.preparePepperRequest = exports.prepareDeployWallet = exports.prepareStartSession = void 0;
var tslib_1 = require("tslib");
var base_1 = require("@celo/base");
var address_1 = require("@celo/base/lib/address");
var signatureUtils_1 = require("@celo/base/lib/signatureUtils");
var contractkit_1 = require("@celo/contractkit");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWallet");
var bls_blinding_client_1 = require("@celo/identity/lib/odis/bls-blinding-client");
var phone_number_identifier_1 = require("@celo/identity/lib/odis/phone-number-identifier");
var dataEncryptionKey_1 = require("@celo/utils/lib/dataEncryptionKey");
var wallet_local_1 = require("@celo/wallet-local");
var login_1 = require("@komenci/kit/lib/login");
var web3_utils_1 = require("web3-utils");
var utils_1 = require("./utils");
var Network;
(function (Network) {
    Network["alfajores"] = "alfajores";
    Network["rc1"] = "rc1";
})(Network || (Network = {}));
var fornoURL = {
    alfajores: 'https://alfajores-forno.celo-testnet.org',
    rc1: 'https://rc1-forno.celo-testnet.org',
};
var WALLET_IMPLEMENTATIONS = (_a = {},
    _a[Network.alfajores] = {
        '1.1.0.0-p1': '0x88a2b9B8387A1823D821E406b4e951337fa1D46D',
        '1.1.0.0-p2': '0x786ec5A4F8DCad3A58D5B1A04cc99B019E426065',
        '1.1.0.0-p3': '0x5C9a6E3c3E862eD306E2E3348EBC8b8310A99e5A',
    },
    _a[Network.rc1] = {
        '1.1.0.0-p2': '0x6511FB5DBfe95859d8759AdAd5503D656E2555d7',
    },
    _a);
var ODIS_PUB_KEYS = {
    alfajores: 'kPoRxWdEdZ/Nd3uQnp3FJFs54zuiS+ksqvOm9x8vY6KHPG8jrfqysvIRU0wtqYsBKA7SoAsICMBv8C/Fb2ZpDOqhSqvr/sZbZoHmQfvbqrzbtDIPvUIrHgRS0ydJCMsA',
    rc1: 'FvreHfLmhBjwxHxsxeyrcOLtSonC9j7K3WrS4QapYsQH6LdaDTaNGmnlQMfFY04Bp/K4wAvqQwO9/bqPVCKf8Ze8OZo8Frmog4JY4xAiwrsqOXxug11+htjEe1pj4uMA',
};
var wrapped = function (fn) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            var next, e_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        next = args[args.length - 1];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        // @ts-ignore
                        return [4 /*yield*/, fn.apply(void 0, args)];
                    case 2:
                        // @ts-ignore
                        _a.sent();
                        next();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.log(e_1);
                        next(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
};
var _kit = null;
var _kitWallet = null;
exports.prepareStartSession = wrapped(function (requestParams, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var captchaToken, accounts, loginStruct, signature, serializedSignature;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                captchaToken = 'special-captcha-bypass-token';
                if (_kit == null || _kitWallet == null) {
                    _kitWallet = new wallet_local_1.LocalWallet();
                    _kit = contractkit_1.newKit(fornoURL[context.vars.$environment], _kitWallet);
                }
                context.vars.pkey = web3_utils_1.randomHex(32);
                context.vars.dek = web3_utils_1.randomHex(32);
                _kitWallet.addAccount(context.vars.pkey);
                context.vars.wallet = _wallet;
                context.vars.contractKit = _kit;
                accounts = _kitWallet.getAccounts();
                context.vars.account = accounts[accounts.length - 1];
                context.vars.externalAccount = address_1.normalizeAddressWith0x(context.vars.account);
                context.vars.dekPublicKey = dataEncryptionKey_1.compressedPubKey(base_1.hexToBuffer(context.vars.dek));
                context.vars.e164Number = "+40" + Math.floor(Math.random() * 1000000000);
                context.vars.blsBlindingClient = new bls_blinding_client_1.WasmBlsBlindingClient(ODIS_PUB_KEYS[context.vars.$environment]);
                loginStruct = login_1.buildLoginTypedData(context.vars.externalAccount, captchaToken);
                return [4 /*yield*/, context.vars.contractKit.signTypedData(context.vars.externalAccount, loginStruct)];
            case 1:
                signature = _a.sent();
                serializedSignature = signatureUtils_1.serializeSignature(signature);
                requestParams.json = {
                    externalAccount: context.vars.externalAccount,
                    captchaResponseToken: captchaToken,
                    signature: serializedSignature
                };
                return [2 /*return*/];
        }
    });
}); });
exports.prepareDeployWallet = wrapped(function (requestParams, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var walletImplementationAddress;
    return tslib_1.__generator(this, function (_a) {
        walletImplementationAddress = WALLET_IMPLEMENTATIONS[context.vars.$environment]['1.1.0.0-p3'];
        requestParams.json = {
            implementationAddress: walletImplementationAddress
        };
        return [2 /*return*/];
    });
}); });
exports.preparePepperRequest = wrapped(function (requestParams, context, ee, next) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var blindedPhoneNumber;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, phone_number_identifier_1.getBlindedPhoneNumber(context.vars.e164Number, context.vars.blsBlindingClient)];
            case 1:
                blindedPhoneNumber = _a.sent();
                requestParams.json = {
                    blindedPhoneNumber: blindedPhoneNumber,
                    clientVersion: "1.1.0.0-p3"
                };
                return [2 /*return*/];
        }
    });
}); });
exports.recordPepperAndIdentifier = wrapped(function (requestParams, response, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var phoneNumberHashDetails;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!response.body.combinedSignature) {
                    console.log(response.body);
                    console.log("Out of quota");
                    return [2 /*return*/];
                }
                return [4 /*yield*/, phone_number_identifier_1.getPhoneNumberIdentifierFromSignature(context.vars.e164Number, response.body.combinedSignature, context.vars.blsBlindingClient)];
            case 1:
                phoneNumberHashDetails = _a.sent();
                context.vars.identifier = phoneNumberHashDetails.phoneHash;
                context.vars.pepper = phoneNumberHashDetails.pepper;
                console.log({
                    identifier: phoneNumberHashDetails.phoneHash,
                    pepper: phoneNumberHashDetails.pepper,
                });
                return [2 /*return*/];
        }
    });
}); });
exports.prepareSetAccount = wrapped(function (requestParams, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var accounts, proofOfPossession, tx, wallet, nonce, signature, rawMetaTx, _a;
    return tslib_1.__generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, context.vars.contractKit.contracts.getAccounts()];
            case 1:
                accounts = _b.sent();
                return [4 /*yield*/, accounts.generateProofOfKeyPossessionLocally(context.vars.metaTxWalletAddress, context.vars.externalAccount, context.vars.pkey)];
            case 2:
                proofOfPossession = _b.sent();
                return [4 /*yield*/, accounts.setAccount('', context.vars.dekPublicKey, context.vars.externalAccount, proofOfPossession)];
            case 3:
                tx = _b.sent();
                return [4 /*yield*/, getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress)];
            case 4:
                wallet = _b.sent();
                return [4 /*yield*/, wallet.nonce()];
            case 5:
                nonce = _b.sent();
                return [4 /*yield*/, wallet.signMetaTransaction(tx.txo, nonce)];
            case 6:
                signature = _b.sent();
                _a = MetaTransactionWallet_1.toRawTransaction;
                return [4 /*yield*/, wallet.executeMetaTransaction(tx.txo, signature).txo];
            case 7:
                rawMetaTx = _a.apply(void 0, [_b.sent()]);
                requestParams.json = {
                    destination: rawMetaTx.destination,
                    data: rawMetaTx.data
                };
                return [2 /*return*/];
        }
    });
}); });
var resetRetryCounter = function (context, events, done) {
    context.vars._retryCounter = 0;
    return done();
};
exports.resetRetryCounter = resetRetryCounter;
exports.waitForWallet = wrapped(function (requestParams, response, context, ee, next) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var addressResp;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(response.body.status === 'deployed')) return [3 /*break*/, 1];
                context.vars.metaTxWalletAddress = response.body.walletAddress;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, utils_1.getAddressFromDeploy(context.vars.contractKit, context.vars.externalAccount, response.body.txHash)];
            case 2:
                addressResp = _a.sent();
                if (addressResp.ok === true) {
                    context.vars.metaTxWalletAddress = addressResp.result;
                }
                else {
                    context.vars._walletError = addressResp.error;
                    context.vars.metaTxWalletAddress = undefined;
                }
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.prepareSubsidisedAttestations = wrapped(function (requestParams, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var attestations, wallet, nonce, attestationsRequested, approveTx, approveTxSig, approveMetaTx, requestTx, requestTxSig, requestMetaTx;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, context.vars.contractKit.contracts.getAttestations()];
            case 1:
                attestations = _a.sent();
                return [4 /*yield*/, getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress)];
            case 2:
                wallet = _a.sent();
                return [4 /*yield*/, wallet.nonce()];
            case 3:
                nonce = _a.sent();
                attestationsRequested = 3;
                return [4 /*yield*/, attestations.approveAttestationFee(attestationsRequested)];
            case 4:
                approveTx = _a.sent();
                return [4 /*yield*/, wallet.signMetaTransaction(approveTx.txo, nonce)];
            case 5:
                approveTxSig = _a.sent();
                return [4 /*yield*/, wallet.executeMetaTransaction(approveTx.txo, approveTxSig)];
            case 6:
                approveMetaTx = _a.sent();
                return [4 /*yield*/, attestations.request(context.vars.identifier, attestationsRequested)];
            case 7:
                requestTx = _a.sent();
                return [4 /*yield*/, wallet.signMetaTransaction(requestTx.txo, nonce + 1)];
            case 8:
                requestTxSig = _a.sent();
                return [4 /*yield*/, wallet.executeMetaTransaction(requestTx.txo, requestTxSig)];
            case 9:
                requestMetaTx = _a.sent();
                requestParams.json = {
                    identifier: context.vars.identifier,
                    attestationsRequested: attestationsRequested,
                    walletAddress: context.vars.metaTxWalletAddress,
                    requestTx: MetaTransactionWallet_1.toRawTransaction(requestMetaTx.txo),
                    approveTx: MetaTransactionWallet_1.toRawTransaction(approveMetaTx.txo),
                };
                return [2 /*return*/];
        }
    });
}); });
exports.prepareSelectIssuers = wrapped(function (requestParams, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var attestations, issuer, wallet, nonce, signature, rawMetaTx, _a;
    return tslib_1.__generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, context.vars.contractKit.contracts.getAttestations()];
            case 1:
                attestations = _b.sent();
                return [4 /*yield*/, attestations.waitForSelectingIssuers(context.vars.identifier, context.vars.metaTxWalletAddress)];
            case 2:
                _b.sent();
                return [4 /*yield*/, attestations.selectIssuers(context.vars.identifier)];
            case 3:
                issuer = _b.sent();
                return [4 /*yield*/, getWallet(context.vars.contractKit, context.vars.metaTxWalletAddress)];
            case 4:
                wallet = _b.sent();
                return [4 /*yield*/, wallet.nonce()];
            case 5:
                nonce = _b.sent();
                return [4 /*yield*/, wallet.signMetaTransaction(issuer.txo, nonce)];
            case 6:
                signature = _b.sent();
                _a = MetaTransactionWallet_1.toRawTransaction;
                return [4 /*yield*/, wallet.executeMetaTransaction(issuer.txo, signature).txo];
            case 7:
                rawMetaTx = _a.apply(void 0, [_b.sent()]);
                requestParams.json = {
                    destination: rawMetaTx.destination,
                    data: rawMetaTx.data
                };
                return [2 /*return*/];
        }
    });
}); });
function logHeaders(requestParams, response, context, ee, next) {
    console.log(response.body);
    return next(); // MUST be called for the scenario to continue
}
exports.logHeaders = logHeaders;
exports.waitForTransaction = wrapped(function (requestParams, response, context, ee) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var receipt;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, utils_1.waitForReceipt(context.vars.contractKit, response.body.txHash)];
            case 1:
                receipt = _a.sent();
                if (receipt.ok === false) {
                    context.vars.latestTxConfirmed = false;
                    context.vars._latestTxError = receipt.error;
                }
                else {
                    context.vars.latestTxConfirmed = true;
                }
                return [2 /*return*/];
        }
    });
}); });
var _wallet;
function getWallet(contractKit, address) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!((_wallet === null || _wallet === void 0 ? void 0 : _wallet.address) !== address)) return [3 /*break*/, 2];
                    return [4 /*yield*/, contractKit.contracts.getMetaTransactionWallet(address)];
                case 1:
                    _wallet = _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, _wallet];
            }
        });
    });
}
exports.getWallet = getWallet;
function walletNotDeployed(context, next) {
    context.vars._retryCounter += 1;
    if (context.vars._retryCounter > 5) {
        throw context.vars._walletError;
    }
    return next(typeof context.vars.metaTxWalletAddress !== 'string');
}
exports.walletNotDeployed = walletNotDeployed;
function latestTxNotConfirmed(context, next) {
    context.vars._retryCounter += 1;
    if (context.vars._retryCounter > 5) {
        throw context.vars._latestTxError;
    }
    return next(context.vars.latestTxConfirmed === false);
}
exports.latestTxNotConfirmed = latestTxNotConfirmed;
var countTry = function (event) { return function (_c, events, done) {
    events.emit('counter', event, 1);
    return done();
}; };
function saveStartSessionStatus(requestParams, response, context, ee, next) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            context.vars._startSessionStatus = response.statusCode;
            return [2 /*return*/, next()];
        });
    });
}
exports.saveStartSessionStatus = saveStartSessionStatus;
function startSessionRateLimited(context, next) {
    return next(context.vars._startSessionStatus === 429);
}
exports.startSessionRateLimited = startSessionRateLimited;
exports.countWalletTry = countTry('walletDeploy');
exports.countSetAccountTry = countTry('setAccount');
exports.countRequestAttestationTry = countTry('requestAttestation');
exports.countSelectIssuersTry = countTry('selectIssuers');
