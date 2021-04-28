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
Object.defineProperty(exports, "__esModule", { value: true });
var result_1 = require("@celo/base/lib/result");
var HttpErrorTypes;
(function (HttpErrorTypes) {
    HttpErrorTypes["RequestError"] = "RequestError";
})(HttpErrorTypes = exports.HttpErrorTypes || (exports.HttpErrorTypes = {}));
var HttpRequestError = (function (_super) {
    __extends(HttpRequestError, _super);
    function HttpRequestError(error) {
        return _super.call(this, HttpErrorTypes.RequestError) || this;
    }
    return HttpRequestError;
}(result_1.RootError));
exports.HttpRequestError = HttpRequestError;
