"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var typeorm_1 = require("typeorm");
var Session = (function () {
    function Session() {
    }
    Session_1 = Session;
    Session.of = function (params) {
        var session = new Session_1();
        Object.assign(session, params);
        return session;
    };
    Session.prototype.getActionCount = function (action) {
        var _a;
        return ((_a = this.meta) === null || _a === void 0 ? void 0 : _a.callCount[action]) || 0;
    };
    var Session_1;
    __decorate([
        typeorm_1.PrimaryGeneratedColumn('uuid'),
        __metadata("design:type", String)
    ], Session.prototype, "id", void 0);
    __decorate([
        typeorm_1.Column(),
        __metadata("design:type", String)
    ], Session.prototype, "externalAccount", void 0);
    __decorate([
        typeorm_1.Column('json', { nullable: true, default: { callCount: {} } }),
        __metadata("design:type", Object)
    ], Session.prototype, "meta", void 0);
    __decorate([
        typeorm_1.Column('timestamp'),
        __metadata("design:type", String)
    ], Session.prototype, "createdAt", void 0);
    __decorate([
        typeorm_1.Column('timestamp', { nullable: true }),
        __metadata("design:type", String)
    ], Session.prototype, "expiredAt", void 0);
    __decorate([
        typeorm_1.Column('timestamp', { nullable: true }),
        __metadata("design:type", String)
    ], Session.prototype, "completedAt", void 0);
    Session = Session_1 = __decorate([
        typeorm_1.Entity()
    ], Session);
    return Session;
}());
exports.Session = Session;
