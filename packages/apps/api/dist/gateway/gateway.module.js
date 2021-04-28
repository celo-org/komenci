"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var logger_1 = require("@komenci/logger");
var captcha_service_1 = require("./captcha/captcha.service");
var device_check_service_1 = require("./device-check/device-check.service");
var gateway_service_1 = require("./gateway.service");
var safety_net_service_1 = require("./safety-net/safety-net.service");
var GatewayModule = (function () {
    function GatewayModule() {
    }
    GatewayModule = __decorate([
        common_1.Module({
            imports: [common_1.HttpModule],
            providers: [
                gateway_service_1.GatewayService,
                captcha_service_1.CaptchaService,
                device_check_service_1.DeviceCheckService,
                safety_net_service_1.SafetyNetService,
                logger_1.KomenciLoggerService
            ],
            exports: [gateway_service_1.GatewayService]
        })
    ], GatewayModule);
    return GatewayModule;
}());
exports.GatewayModule = GatewayModule;
