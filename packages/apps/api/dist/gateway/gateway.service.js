"use strict";
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
var common_1 = require("@nestjs/common");
var core_1 = require("@nestjs/core");
var logger_1 = require("@komenci/logger");
var rules_config_1 = require("../config/rules.config");
var captcha_rule_1 = require("./rules/captcha.rule");
var daily_cap_rule_1 = require("./rules/daily-cap.rule");
var device_attestation_rule_1 = require("./rules/device-attestation.rule");
var signature_rule_1 = require("./rules/signature.rule");
var GatewayService = (function () {
    function GatewayService(config, moduleRef, logger) {
        this.config = config;
        this.moduleRef = moduleRef;
        this.logger = logger;
    }
    GatewayService.prototype.onModuleInit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4, Promise.all([
                                this.moduleRef.create(daily_cap_rule_1.DailyCapRule),
                                this.moduleRef.create(captcha_rule_1.CaptchaRule),
                                this.moduleRef.create(device_attestation_rule_1.DeviceAttestationRule),
                                this.moduleRef.create(signature_rule_1.SignatureRule)
                            ])];
                    case 1:
                        _a.rules = _b.sent();
                        return [2];
                }
            });
        });
    };
    GatewayService.prototype.verify = function (startSessionDto, req) {
        return __awaiter(this, void 0, void 0, function () {
            var enabledRules, context, results, hasFailingResult;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        enabledRules = this.rules.filter(function (rule) { return _this.config.enabled[rule.getID()]; });
                        context = { req: req };
                        return [4, Promise.all(enabledRules.map(function (rule) {
                                return rule.verify(startSessionDto, _this.config.configs[rule.getID()], context);
                            }))];
                    case 1:
                        results = _a.sent();
                        hasFailingResult = false;
                        results.forEach(function (result, idx) {
                            _this.logger.event(logger_1.EventType.RuleVerified, {
                                ruleId: enabledRules[idx].getID(),
                                externalAccount: startSessionDto.externalAccount,
                                result: result.ok
                            });
                            if (result.ok === false) {
                                hasFailingResult = true;
                                _this.logger.error(result.error);
                            }
                        });
                        return [2, !hasFailingResult];
                }
            });
        });
    };
    GatewayService = __decorate([
        common_1.Injectable(),
        __param(0, common_1.Inject(rules_config_1.rulesConfig.KEY)),
        __metadata("design:paramtypes", [void 0, core_1.ModuleRef,
            logger_1.KomenciLoggerService])
    ], GatewayService);
    return GatewayService;
}());
exports.GatewayService = GatewayService;
