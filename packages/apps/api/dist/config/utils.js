"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberFromEnv = function (key, defaultValue) {
    var rawValue = process.env[key];
    return rawValue && !isNaN(+rawValue)
        ? +rawValue
        : defaultValue;
};
