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
var Either_1 = require("fp-ts/Either");
var t = require("io-ts");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var common_1 = require("@nestjs/common");
var core_1 = require("@nestjs/core");
var microservices_1 = require("@nestjs/microservices");
var result_1 = require("@celo/base/lib/result");
var core_2 = require("@komenci/core");
var app_config_1 = require("../config/app.config");
var app_controller_1 = require("@komenci/relayer/dist/app.controller");
var RelayerErrorTypes;
(function (RelayerErrorTypes) {
    RelayerErrorTypes["RelayerTimeout"] = "RelayerTimeout";
    RelayerErrorTypes["RelayerCommunicationError"] = "RelayerCommunicationError";
    RelayerErrorTypes["RelayerInternalError"] = "RelayerInternalError";
})(RelayerErrorTypes = exports.RelayerErrorTypes || (exports.RelayerErrorTypes = {}));
var InternalErrorPayload = t.type({
    errorType: t.string,
    message: t.string,
    metadata: t.unknown
});
var RelayerTimeout = (function (_super) {
    __extends(RelayerTimeout, _super);
    function RelayerTimeout(cmd) {
        var _this = _super.call(this, RelayerErrorTypes.RelayerTimeout) || this;
        _this.cmd = cmd;
        _this.metadataProps = ['cmd'];
        return _this;
    }
    return RelayerTimeout;
}(core_2.MetadataError));
var RelayerCommunicationError = (function (_super) {
    __extends(RelayerCommunicationError, _super);
    function RelayerCommunicationError(message, cmd) {
        var _this = _super.call(this, RelayerErrorTypes.RelayerCommunicationError) || this;
        _this.message = message;
        _this.cmd = cmd;
        _this.metadataProps = ['cmd'];
        return _this;
    }
    return RelayerCommunicationError;
}(core_2.MetadataError));
var RelayerInternalError = (function (_super) {
    __extends(RelayerInternalError, _super);
    function RelayerInternalError(internalError) {
        var _this = _super.call(this, RelayerErrorTypes.RelayerInternalError) || this;
        _this.internalError = internalError;
        _this.metadataProps = ['internalError'];
        _this.message = "Relayer encountered an error";
        return _this;
    }
    return RelayerInternalError;
}(core_2.MetadataError));
var RelayerProxyService = (function () {
    function RelayerProxyService(client, cfg, req) {
        this.client = client;
        this.cfg = cfg;
        this.req = req;
    }
    RelayerProxyService.prototype.signPersonalMessage = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.execute(app_controller_1.RelayerCmd.SignPersonalMessage, input)];
            });
        });
    };
    RelayerProxyService.prototype.getPhoneNumberIdentifier = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.execute(app_controller_1.RelayerCmd.GetPhoneNumberIdentifier, input)];
            });
        });
    };
    RelayerProxyService.prototype.submitTransaction = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.execute(app_controller_1.RelayerCmd.SubmitTransaction, input)];
            });
        });
    };
    RelayerProxyService.prototype.submitTransactionBatch = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.execute(app_controller_1.RelayerCmd.SubmitTransactionBatch, input)];
            });
        });
    };
    RelayerProxyService.prototype.execute = function (cmd, input) {
        var inputWithContext = __assign(__assign({}, input), { context: this.context });
        return rxjs_1.race(rxjs_1.of('timeout').pipe(operators_1.delay(this.cfg.relayerRpcTimeoutMs), operators_1.map(function (_) { return result_1.Err(new RelayerTimeout(cmd)); })), this.client.send({ cmd: cmd }, inputWithContext).pipe(operators_1.map(function (resp) { return result_1.Ok(resp); }), operators_1.catchError(function (err) {
            var res = InternalErrorPayload.decode(err);
            if (Either_1.isRight(res)) {
                return rxjs_1.of(result_1.Err(new RelayerInternalError(res.right)));
            }
            else {
                return rxjs_1.of(result_1.Err(new RelayerCommunicationError(err.message, cmd)));
            }
        }))).toPromise();
    };
    Object.defineProperty(RelayerProxyService.prototype, "context", {
        get: function () {
            var _a, _b;
            return {
                traceId: this.req.id,
                labels: (this.req.session
                    ? [
                        { key: 'sessionId', value: (_a = this.req.session) === null || _a === void 0 ? void 0 : _a.id },
                        { key: 'externalAccount', value: (_b = this.req.session) === null || _b === void 0 ? void 0 : _b.externalAccount },
                    ]
                    : [])
            };
        },
        enumerable: true,
        configurable: true
    });
    RelayerProxyService = __decorate([
        common_1.Injectable({
            scope: common_1.Scope.REQUEST
        }),
        __param(0, common_1.Inject('RELAYER_SERVICE')),
        __param(1, common_1.Inject(app_config_1.appConfig.KEY)),
        __param(2, common_1.Inject(core_1.REQUEST)),
        __metadata("design:paramtypes", [microservices_1.ClientProxy, Object, Object])
    ], RelayerProxyService);
    return RelayerProxyService;
}());
exports.RelayerProxyService = RelayerProxyService;
