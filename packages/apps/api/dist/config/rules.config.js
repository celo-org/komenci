"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rule_1 = require("../gateway/rules/rule");
var config_1 = require("@nestjs/config");
var isTrue = function (content) { return String(content).toLowerCase() === 'true'; };
exports.rulesConfig = config_1.registerAs('rules', function () {
    var _a, _b;
    return ({
        enabled: (_a = {},
            _a[rule_1.RuleID.DailyCap] = isTrue(process.env.RULE_DAILY_CAP_ENABLED),
            _a[rule_1.RuleID.Captcha] = isTrue(process.env.RULE_CAPTCHA_ENABLED),
            _a[rule_1.RuleID.DeviceAttestation] = isTrue(process.env.RULE_DEVICE_ATTESTATION_ENABLED),
            _a[rule_1.RuleID.Signature] = isTrue(process.env.RULE_SIGNATURE_ENABLED),
            _a),
        configs: (_b = {},
            _b[rule_1.RuleID.DailyCap] = null,
            _b[rule_1.RuleID.Captcha] = {
                bypassEnabled: isTrue(process.env.RULE_CAPTCHA_CONFIG_BYPASS_ENABLED),
                bypassToken: process.env.RULE_CAPTCHA_CONFIG_BYPASS_TOKEN || ""
            },
            _b[rule_1.RuleID.DeviceAttestation] = null,
            _b[rule_1.RuleID.Signature] = null,
            _b),
    });
});
