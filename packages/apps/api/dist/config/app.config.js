"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
exports.appConfig = config_1.registerAs('app', function () { return ({
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT, 10) || 3000,
    jwt_secret: process.env.JWT_SECRET || 'secret123456789',
    log_level: process.env.LOG_LEVEL || 'debug',
    transactionTimeoutMs: parseInt(process.env.TRANSACTION_TIMEOUT_MS, 10) || 10000,
    useAttestationGuards: process.env.USE_ATTESTATION_GUARDS === 'true',
    relayerRpcTimeoutMs: parseInt(process.env.RELAYER_RPC_TIMEOUT_MS, 10) || 5000,
    callbackUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
    version: process.env.KOMENCI_VERSION || 'version-missing',
    service: process.env.KOMENCI_SERVICE || 'komenci-api',
}); });
