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
var uuid_1 = require("uuid");
exports.loggerConfigFactory = function (config) {
    var appCfg = config.get('app');
    return {
        exclude: [
            "v1/health"
        ],
        pinoHttp: {
            formatters: {
                level: core_1.levelFormatter(appCfg),
                log: function (object) {
                    var _a, _b, _c, _d, _e;
                    var logObject = object;
                    var stackProp = ((_a = logObject === null || logObject === void 0 ? void 0 : logObject.err) === null || _a === void 0 ? void 0 : _a.stack) ? { stack_trace: logObject.err.stack }
                        : {};
                    var httpRequest = 'res' in object ? {
                        httpRequest: __assign({}, object),
                        sessionId: (_c = (_b = object.res.req) === null || _b === void 0 ? void 0 : _b.session) === null || _c === void 0 ? void 0 : _c.id,
                        externalAccount: (_e = (_d = object.res.req) === null || _d === void 0 ? void 0 : _d.session) === null || _e === void 0 ? void 0 : _e.externalAccount,
                        res: undefined,
                        responseTime: undefined
                    } : {};
                    return __assign(__assign(__assign({}, object), stackProp), httpRequest);
                },
            },
            base: __assign({}, core_1.buildLabels(appCfg)),
            customAttributeKeys: {
                req: 'logging.googleapis.com/trace'
            },
            genReqId: function () {
                return uuid_1.v4();
            },
            customSuccessMessage: function (res) {
                return "Success";
            },
            customErrorMessage: function (err, res) {
                return "Error: " + err.message;
            },
            messageKey: 'message',
            serializers: {
                httpRequest: function (_a) {
                    var res = _a.res, error = _a.error, responseTime = _a.responseTime;
                    var req = res.req;
                    return {
                        requestMethod: req.method,
                        requestUrl: req.url,
                        requestSize: "" + req.readableLength,
                        status: res.statusCode,
                        responseSize: res.getHeader('content-length'),
                        userAgent: req.headers['user-agent'],
                        remoteIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        referer: req.headers.referer,
                        latency: responseTime / 1000 + "s",
                    };
                },
                req: function (req) { return req.id; }
            },
            prettyPrint: process.env.NODE_ENV !== 'production'
        }
    };
};
