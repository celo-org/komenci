"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var base_1 = require("@celo/base");
var core_1 = require("@komenci/core");
var MethodFilter = (function () {
    function MethodFilter() {
        this.methods = new Map();
    }
    MethodFilter.prototype.addContract = function (name, wrapper, methods) {
        var _this = this;
        methods.forEach(function (methodName) {
            var methodId = wrapper.methodIds[methodName];
            var methodKey = _this.buildKey(wrapper.address, methodId);
            _this.methods.set(methodKey, {
                methodName: "" + methodName,
                contractName: name
            });
        });
        return this;
    };
    MethodFilter.prototype.find = function (raw) {
        var methodId = core_1.extractMethodId(raw.data);
        var key = this.buildKey(raw.destination, methodId);
        var method = this.methods.get(key);
        if (method) {
            return base_1.Ok(__assign({ raw: raw, methodId: methodId }, method));
        }
        return base_1.Err(new Error());
    };
    MethodFilter.prototype.buildKey = function (contractAddress, methodId) {
        return base_1.normalizeAddress(contractAddress) + ":" + core_1.normalizeMethodId(methodId);
    };
    return MethodFilter;
}());
exports.MethodFilter = MethodFilter;
