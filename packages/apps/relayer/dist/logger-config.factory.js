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
var core_1 = require("@komenci/core");
exports.loggerConfigFactory = function (config) {
    var appCfg = config.get('app');
    var walletCfg = config.get('wallet');
    return {
        pinoHttp: {
            formatters: {
                level: core_1.levelFormatter(appCfg)
            },
            base: __assign({}, core_1.buildLabels(appCfg, {
                relayer: walletCfg.address
            })),
            messageKey: 'message',
            prettyPrint: process.env.NODE_ENV !== 'production'
        }
    };
};
