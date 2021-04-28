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
var core_1 = require("@komenci/core");
var RawTransactionDto_1 = require("@komenci/relayer/dist/dto/RawTransactionDto");
var class_validator_1 = require("class-validator");
var RequestAttestationsDto = (function () {
    function RequestAttestationsDto() {
    }
    var _a, _b;
    __decorate([
        class_validator_1.IsString(),
        class_validator_1.IsNotEmpty(),
        __metadata("design:type", String)
    ], RequestAttestationsDto.prototype, "identifier", void 0);
    __decorate([
        class_validator_1.IsNumber(),
        class_validator_1.IsPositive(),
        __metadata("design:type", Number)
    ], RequestAttestationsDto.prototype, "attestationsRequested", void 0);
    __decorate([
        core_1.IsCeloAddress(),
        __metadata("design:type", String)
    ], RequestAttestationsDto.prototype, "walletAddress", void 0);
    __decorate([
        class_validator_1.ValidateNested(),
        __metadata("design:type", typeof (_a = typeof RawTransactionDto_1.RawTransactionDto !== "undefined" && RawTransactionDto_1.RawTransactionDto) === "function" ? _a : Object)
    ], RequestAttestationsDto.prototype, "requestTx", void 0);
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.ValidateNested(),
        __metadata("design:type", typeof (_b = typeof RawTransactionDto_1.RawTransactionDto !== "undefined" && RawTransactionDto_1.RawTransactionDto) === "function" ? _b : Object)
    ], RequestAttestationsDto.prototype, "approveTx", void 0);
    return RequestAttestationsDto;
}());
exports.RequestAttestationsDto = RequestAttestationsDto;
