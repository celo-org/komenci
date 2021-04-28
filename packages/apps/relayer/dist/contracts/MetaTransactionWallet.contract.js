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
var base_1 = require("@celo/base");
var contractkit_1 = require("@celo/contractkit");
var MetaTransactionWallet_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWallet");
var MetaTransactionWalletDeployer_1 = require("@celo/contractkit/lib/wrappers/MetaTransactionWalletDeployer");
var address_1 = require("@celo/utils/lib/address");
var RelayerMTWErrorTypes;
(function (RelayerMTWErrorTypes) {
    RelayerMTWErrorTypes["NotRegister"] = "RelayerNotRegistered";
    RelayerMTWErrorTypes["InvalidMTW"] = "InvalidMTW";
})(RelayerMTWErrorTypes || (RelayerMTWErrorTypes = {}));
var RelayerNotRegisteredError = (function (_super) {
    __extends(RelayerNotRegisteredError, _super);
    function RelayerNotRegisteredError() {
        var _this = _super.call(this, RelayerMTWErrorTypes.NotRegister) || this;
        _this.message = "Relayer not registered as a relayer in config";
        return _this;
    }
    return RelayerNotRegisteredError;
}(base_1.RootError));
var InvalidMTWError = (function (_super) {
    __extends(InvalidMTWError, _super);
    function InvalidMTWError(address) {
        var _this = _super.call(this, RelayerMTWErrorTypes.InvalidMTW) || this;
        _this.address = address;
        _this.metadataProps = ['address'];
        _this.message = "Relayer doesn't have a valid associated MTW in config";
        return _this;
    }
    return InvalidMTWError;
}(core_1.MetadataError));
exports.metaTransactionWalletProvider = {
    provide: MetaTransactionWallet_1.MetaTransactionWalletWrapper,
    useFactory: function (networkCfg, walletCfg, deployer, contractKit, logger) { return __awaiter(void 0, void 0, void 0, function () {
        var relayer;
        return __generator(this, function (_a) {
            relayer = networkCfg.relayers.find(function (r) {
                return base_1.normalizeAddress(r.externalAccount) === base_1.normalizeAddress(walletCfg.address);
            });
            if (relayer === undefined) {
                logger.logAndThrow(new RelayerNotRegisteredError());
            }
            if (address_1.isValidAddress(relayer.metaTransactionWallet)) {
                logger.event(logger_1.EventType.RelayerMTWInit, {
                    mtwAddress: relayer.metaTransactionWallet
                });
                return [2, contractKit.contracts.getMetaTransactionWallet(relayer.metaTransactionWallet)];
            }
            else {
                logger.logAndThrow(new InvalidMTWError(relayer.metaTransactionWallet));
            }
            return [2];
        });
    }); },
    inject: [
        core_1.networkConfig.KEY,
        wallet_config_1.walletConfig.KEY,
        MetaTransactionWalletDeployer_1.MetaTransactionWalletDeployerWrapper,
        contractkit_1.ContractKit,
        logger_1.KomenciLoggerService
    ]
};
