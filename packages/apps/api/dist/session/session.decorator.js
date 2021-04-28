"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
exports.SessionDecorator = common_1.createParamDecorator(function (data, ctx) {
    var request = ctx.switchToHttp().getRequest();
    var session = request.session;
    return data ? session && session.completedAt : session;
});
