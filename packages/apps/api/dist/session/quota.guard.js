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
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var core_1 = require("@nestjs/core");
var core_2 = require("@komenci/core");
var quota_config_1 = require("../config/quota.config");
var QuotaExceededError = (function (_super) {
    __extends(QuotaExceededError, _super);
    function QuotaExceededError(action) {
        var _this = _super.call(this, 'QuotaExceededError') || this;
        _this.action = action;
        _this.statusCode = 429;
        _this.metadataProps = ['action'];
        _this.message = "Quota exceeded on " + action;
        return _this;
    }
    return QuotaExceededError;
}(core_2.ApiError));
var QuotaGuard = (function () {
    function QuotaGuard(reflector, config) {
        this.reflector = reflector;
        this.config = config;
    }
    QuotaGuard.prototype.canActivate = function (context) {
        var action = this.reflector.get('trackedAction', context.getHandler());
        if (!action) {
            return true;
        }
        var request = context.switchToHttp().getRequest();
        var session = request.session;
        var usage = session.getActionCount(action);
        if (usage >= this.config[action]) {
            throw new QuotaExceededError(action);
        }
        return true;
    };
    QuotaGuard = __decorate([
        common_1.Injectable(),
        __param(1, common_1.Inject(quota_config_1.quotaConfig.KEY)),
        __metadata("design:paramtypes", [core_1.Reflector, void 0])
    ], QuotaGuard);
    return QuotaGuard;
}());
exports.QuotaGuard = QuotaGuard;
