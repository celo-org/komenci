"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
exports.thirdPartyConfig = config_1.registerAs('thirdParty', function () { return ({
    recaptchaUri: 'https://www.google.com/recaptcha/api/siteverify',
    recaptchaToken: process.env.RECAPTCHA_TOKEN,
    appleDeviceCheckUrl: "https://api.development.devicecheck.apple.com",
    appleDeviceCheckToken: process.env.APPLE_DEVICE_CHECK_TOKEN,
    appleDeviceCheckTeamID: process.env.TEAM_ID,
    appleDeviceCheckKeyID: process.env.APPLE_DEVICE_KEY_ID,
    appleDeviceCheckCert: process.env.APPLE_DEVICE_CERT,
    androidSafetyNetUrl: "https://www.googleapis.com/androidcheck/v1/attestations/verify",
    androidSafetyNetToken: process.env.ANDROID_SAFETYNET_TOKEN
}); });
