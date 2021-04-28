"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var session_repository_1 = require("./session.repository");
var session_service_1 = require("./session.service");
var SessionModule = (function () {
    function SessionModule() {
    }
    SessionModule = __decorate([
        common_1.Module({
            imports: [typeorm_1.TypeOrmModule.forFeature([session_repository_1.SessionRepository])],
            providers: [session_service_1.SessionService],
            exports: [typeorm_1.TypeOrmModule]
        })
    ], SessionModule);
    return SessionModule;
}());
exports.SessionModule = SessionModule;
