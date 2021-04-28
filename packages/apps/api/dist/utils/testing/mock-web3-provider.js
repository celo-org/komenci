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
exports.buildMockWeb3Provider = void 0;
var web3_1 = require("web3");
var buildMockWeb3Provider = function (resultForPayload, overrides) {
    if (overrides === void 0) { overrides = {}; }
    var sendMock = jest.fn().mockImplementation(function (payload, callback) {
        var _a = payload.params[0].to === '0x000000000000000000000000000000000000ce10'
            ? [null, web3_1.default.utils.padLeft(web3_1.default.utils.randomHex(20), 64)]
            : resultForPayload(payload), err = _a[0], result = _a[1];
        callback(err, {
            jsonrpc: payload.jsonrpc,
            id: parseInt(payload.id, 10),
            result: result,
        });
    });
    return __assign({ host: 'mock-web3-host', connected: true, send: sendMock, supportsSubscriptions: function () { return true; }, disconnect: function () { return true; } }, overrides);
};
exports.buildMockWeb3Provider = buildMockWeb3Provider;
