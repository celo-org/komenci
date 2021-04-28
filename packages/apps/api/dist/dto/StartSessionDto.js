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
Object.defineProperty(exports, "__esModule", { value: true });
var class_validator_1 = require("class-validator");
var core_1 = require("@komenci/core");
var DeviceType;
(function (DeviceType) {
    DeviceType["Android"] = "android";
    DeviceType["iOS"] = "ios";
})(DeviceType = exports.DeviceType || (exports.DeviceType = {}));
var StartSessionDto = (function () {
    function StartSessionDto() {
    }
    __decorate([
        class_validator_1.IsNotEmpty(),
        __metadata("design:type", String)
    ], StartSessionDto.prototype, "captchaResponseToken", void 0);
    __decorate([
        class_validator_1.IsNotEmpty(),
        core_1.IsCeloAddress(),
        __metadata("design:type", String)
    ], StartSessionDto.prototype, "externalAccount", void 0);
    __decorate([
        class_validator_1.IsNotEmpty(),
        class_validator_1.IsHexadecimal(),
        __metadata("design:type", String)
    ], StartSessionDto.prototype, "signature", void 0);
    __decorate([
        class_validator_1.IsOptional(),
        __metadata("design:type", String)
    ], StartSessionDto.prototype, "deviceType", void 0);
    __decorate([
        class_validator_1.ValidateIf(function (o) { return o.deviceType === DeviceType.iOS; }),
        class_validator_1.IsNotEmpty(),
        __metadata("design:type", String)
    ], StartSessionDto.prototype, "iosDeviceToken", void 0);
    __decorate([
        class_validator_1.ValidateIf(function (o) { return o.deviceType === DeviceType.Android; }),
        class_validator_1.IsNotEmpty(),
        __metadata("design:type", String)
    ], StartSessionDto.prototype, "androidSignedAttestation", void 0);
    return StartSessionDto;
}());
exports.StartSessionDto = StartSessionDto;
