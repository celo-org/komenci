"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
exports.QuotaAction = function (action) { return common_1.SetMetadata('trackedAction', action); };
