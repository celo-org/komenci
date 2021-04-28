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
var RelayerTraceContext = (function () {
    function RelayerTraceContext() {
    }
    __decorate([
        class_validator_1.IsHexadecimal(),
        __metadata("design:type", String)
    ], RelayerTraceContext.prototype, "traceId", void 0);
    __decorate([
        class_validator_1.ValidateNested(),
        __metadata("design:type", Array)
    ], RelayerTraceContext.prototype, "labels", void 0);
    return RelayerTraceContext;
}());
exports.RelayerTraceContext = RelayerTraceContext;
var TraceContextLabel = (function () {
    function TraceContextLabel() {
    }
    __decorate([
        class_validator_1.IsString(),
        __metadata("design:type", String)
    ], TraceContextLabel.prototype, "key", void 0);
    __decorate([
        class_validator_1.IsString(),
        __metadata("design:type", String)
    ], TraceContextLabel.prototype, "value", void 0);
    return TraceContextLabel;
}());
exports.TraceContextLabel = TraceContextLabel;
var RelayerCommandDto = (function () {
    function RelayerCommandDto() {
    }
    __decorate([
        class_validator_1.ValidateNested(),
        __metadata("design:type", RelayerTraceContext)
    ], RelayerCommandDto.prototype, "context", void 0);
    return RelayerCommandDto;
}());
exports.RelayerCommandDto = RelayerCommandDto;
