"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
var utils_1 = require("./utils");
exports.throttleConfig = config_1.registerAs('throttle', function () { return ({
    ttl: utils_1.numberFromEnv("THROTTLE_TTL", 60),
    limit: utils_1.numberFromEnv("THROTTLE_LIMIT", 15)
}); });
