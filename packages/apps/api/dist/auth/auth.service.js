"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("@komenci/logger/dist/errors");
var common_1 = require("@nestjs/common");
var jwt_1 = require("@nestjs/jwt");
var session_service_1 = require("../session/session.service");
var Either_1 = require("fp-ts/Either");
var t = require("io-ts");
exports.TokenPayload = t.type({
    sessionId: t.string
});
var AuthErrorTypes;
(function (AuthErrorTypes) {
    AuthErrorTypes["InvalidToken"] = "InvalidToken";
    AuthErrorTypes["SessionUnavailable"] = "SessionUnavailable";
})(AuthErrorTypes = exports.AuthErrorTypes || (exports.AuthErrorTypes = {}));
var InvalidToken = (function (_super) {
    __extends(InvalidToken, _super);
    function InvalidToken() {
        var _this = _super.call(this, AuthErrorTypes.InvalidToken) || this;
        _this.statusCode = 401;
        _this.metadataProps = [];
        _this.message = 'Invalid or outdated token';
        return _this;
    }
    return InvalidToken;
}(errors_1.ApiError));
exports.InvalidToken = InvalidToken;
var SessionUnavailable = (function (_super) {
    __extends(SessionUnavailable, _super);
    function SessionUnavailable(sessionId) {
        var _this = _super.call(this, AuthErrorTypes.SessionUnavailable) || this;
        _this.sessionId = sessionId;
        _this.statusCode = 401;
        _this.metadataProps = ['sessionId'];
        _this.message = 'Session no longer available';
        return _this;
    }
    return SessionUnavailable;
}(errors_1.ApiError));
exports.SessionUnavailable = SessionUnavailable;
var AuthService = (function () {
    function AuthService(jwtService, sessionService) {
        this.jwtService = jwtService;
        this.sessionService = sessionService;
    }
    AuthService.prototype.startSession = function (externalAccount) {
        return __awaiter(this, void 0, void 0, function () {
            var session, payload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.sessionService.findOrCreateForAccount(externalAccount)];
                    case 1:
                        session = _a.sent();
                        payload = {
                            sessionId: session.id
                        };
                        return [2, {
                                sessionId: session.id,
                                token: this.jwtService.sign(payload)
                            }];
                }
            });
        });
    };
    AuthService.prototype.recoverSession = function (tokenPayload) {
        return __awaiter(this, void 0, void 0, function () {
            var result, payload, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = exports.TokenPayload.decode(tokenPayload);
                        if (Either_1.isLeft(result)) {
                            throw new InvalidToken();
                        }
                        payload = result.right;
                        return [4, this.sessionService.findOne(payload.sessionId)];
                    case 1:
                        session = _a.sent();
                        if (session) {
                            return [2, session];
                        }
                        else {
                            throw new SessionUnavailable(payload.sessionId);
                        }
                        return [2];
                }
            });
        });
    };
    AuthService = __decorate([
        common_1.Injectable(),
        __metadata("design:paramtypes", [jwt_1.JwtService,
            session_service_1.SessionService])
    ], AuthService);
    return AuthService;
}());
exports.AuthService = AuthService;
