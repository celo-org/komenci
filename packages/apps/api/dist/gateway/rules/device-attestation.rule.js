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
var result_1 = require("@celo/base/lib/result");
var common_1 = require("@nestjs/common");
var StartSessionDto_1 = require("../..//dto/StartSessionDto");
var device_check_service_1 = require("../device-check/device-check.service");
var rule_1 = require("../rules/rule");
var safety_net_service_1 = require("../safety-net/safety-net.service");
var DeviceAttestationErrorTypes;
(function (DeviceAttestationErrorTypes) {
    DeviceAttestationErrorTypes["InvalidDevice"] = "invalid-device";
    DeviceAttestationErrorTypes["VerificationFailed"] = "verification-failed";
})(DeviceAttestationErrorTypes || (DeviceAttestationErrorTypes = {}));
var InvalidDeviceError = (function (_super) {
    __extends(InvalidDeviceError, _super);
    function InvalidDeviceError() {
        return _super.call(this, DeviceAttestationErrorTypes.InvalidDevice) || this;
    }
    return InvalidDeviceError;
}(result_1.RootError));
exports.InvalidDeviceError = InvalidDeviceError;
var VerificationFailedError = (function (_super) {
    __extends(VerificationFailedError, _super);
    function VerificationFailedError() {
        return _super.call(this, DeviceAttestationErrorTypes.VerificationFailed) || this;
    }
    return VerificationFailedError;
}(result_1.RootError));
exports.VerificationFailedError = VerificationFailedError;
var DeviceAttestationRule = (function () {
    function DeviceAttestationRule(deviceCheckService, safetyNetService) {
        this.deviceCheckService = deviceCheckService;
        this.safetyNetService = safetyNetService;
    }
    DeviceAttestationRule.prototype.getID = function () {
        return rule_1.RuleID.DeviceAttestation;
    };
    DeviceAttestationRule.prototype.verify = function (input, config, context) {
        return __awaiter(this, void 0, void 0, function () {
            var result, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(input.deviceType === StartSessionDto_1.DeviceType.Android)) return [3, 2];
                        return [4, this.safetyNetService.verifyDevice({
                                signedAttestation: input.androidSignedAttestation
                            })];
                    case 1:
                        result = _a.sent();
                        if (result.isValidSignature) {
                            return [2, result_1.Ok(true)];
                        }
                        else {
                            return [2, result_1.Err(new VerificationFailedError())];
                        }
                        return [3, 4];
                    case 2:
                        if (!(input.deviceType === StartSessionDto_1.DeviceType.iOS)) return [3, 4];
                        return [4, this.deviceCheckService.verifyDevice({ deviceToken: input.iosDeviceToken })];
                    case 3:
                        result = _a.sent();
                        if (result) {
                            return [2, result_1.Ok(true)];
                        }
                        else {
                            return [2, result_1.Err(new VerificationFailedError())];
                        }
                        _a.label = 4;
                    case 4: return [2, result_1.Err(new InvalidDeviceError())];
                }
            });
        });
    };
    DeviceAttestationRule = __decorate([
        common_1.Injectable(),
        __metadata("design:paramtypes", [device_check_service_1.DeviceCheckService,
            safety_net_service_1.SafetyNetService])
    ], DeviceAttestationRule);
    return DeviceAttestationRule;
}());
exports.DeviceAttestationRule = DeviceAttestationRule;
