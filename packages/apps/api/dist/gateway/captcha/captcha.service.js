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
var core_1 = require("@komenci/core");
var result_1 = require("@celo/base/lib/result");
var common_1 = require("@nestjs/common");
var third_party_config_1 = require("../../config/third-party.config");
var http_1 = require("../../errors/http");
var ReCAPTCHAErrorTypes;
(function (ReCAPTCHAErrorTypes) {
    ReCAPTCHAErrorTypes["VerificationFailed"] = "RecaptchaVerificationFailed";
})(ReCAPTCHAErrorTypes = exports.ReCAPTCHAErrorTypes || (exports.ReCAPTCHAErrorTypes = {}));
var CaptchaVerificationFailed = (function (_super) {
    __extends(CaptchaVerificationFailed, _super);
    function CaptchaVerificationFailed(errorCodes, token) {
        var _this = _super.call(this, ReCAPTCHAErrorTypes.VerificationFailed) || this;
        _this.errorCodes = errorCodes;
        _this.token = token;
        _this.metadataProps = ['errorCodes', 'token'];
        return _this;
    }
    return CaptchaVerificationFailed;
}(core_1.MetadataError));
exports.CaptchaVerificationFailed = CaptchaVerificationFailed;
var CaptchaService = (function () {
    function CaptchaService(config, httpService) {
        this.config = config;
        this.httpService = httpService;
    }
    CaptchaService.prototype.verifyCaptcha = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.httpService
                        .get(this.config.recaptchaUri, {
                        params: {
                            secret: this.config.recaptchaToken,
                            response: token
                        }
                    })
                        .toPromise()
                        .then(function (_a) {
                        var data = _a.data;
                        if (data.success === true) {
                            return result_1.Ok(true);
                        }
                        else {
                            return result_1.Err(new CaptchaVerificationFailed(data['error-codes'], token));
                        }
                    })
                        .catch(function (error) {
                        return result_1.Err(new http_1.HttpRequestError(error));
                    })];
            });
        });
    };
    CaptchaService = __decorate([
        common_1.Injectable(),
        __param(0, common_1.Inject(third_party_config_1.thirdPartyConfig.KEY)),
        __metadata("design:paramtypes", [Object, common_1.HttpService])
    ], CaptchaService);
    return CaptchaService;
}());
exports.CaptchaService = CaptchaService;
