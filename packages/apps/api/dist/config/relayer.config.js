"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
var microservices_1 = require("@nestjs/microservices");
exports.relayerConfig = config_1.registerAs('relayer', function () { return ({
    transport: microservices_1.Transport.TCP,
    options: {
        host: process.env.RELAYER_HOST,
        port: parseInt(process.env.RELAYER_PORT, 10)
    }
}); });
