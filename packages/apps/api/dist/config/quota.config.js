"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
var utils_1 = require("./utils");
var TrackedAction;
(function (TrackedAction) {
    TrackedAction["DistributedBlindedPepper"] = "distributedBlindedPepper";
    TrackedAction["RequestSubsidisedAttestation"] = "requestSubsidisedAttestation";
    TrackedAction["SubmitMetaTransaction"] = "submitMetaTransaction";
})(TrackedAction = exports.TrackedAction || (exports.TrackedAction = {}));
exports.quotaConfig = config_1.registerAs('quota', function () {
    var _a;
    return (_a = {},
        _a[TrackedAction.DistributedBlindedPepper] = utils_1.numberFromEnv('QUOTA_DISTRIBUTED_BLINDED_PEPPER', 1),
        _a[TrackedAction.RequestSubsidisedAttestation] = utils_1.numberFromEnv('QUOTA_REQUEST_SUBSIDISED_ATTESTATION', 10),
        _a[TrackedAction.SubmitMetaTransaction] = utils_1.numberFromEnv('QUOTA_SUBMIT_META_TRANSACTION', 20),
        _a);
});
