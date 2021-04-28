"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsCeloAddress = void 0;
var class_validator_1 = require("class-validator");
var web3_1 = require("web3");
function IsCeloAddress() {
    return function (object, propertyName) {
        class_validator_1.registerDecorator({
            name: 'isCeloAddress',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                message: propertyName + " must be a valid Celo address"
            },
            validator: {
                validate: function (value, args) {
                    return typeof value === 'string' && web3_1.default.utils.isAddress(value);
                },
            },
        });
    };
}
exports.IsCeloAddress = IsCeloAddress;
