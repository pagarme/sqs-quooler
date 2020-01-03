"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bluebird_1 = __importDefault(require("bluebird"));
var Signal = /** @class */ (function () {
    function Signal() {
        var self = this;
        this.promise = new bluebird_1.default(function (resolve) {
            self.triggerFn = resolve;
        });
    }
    Signal.prototype.trigger = function () {
        this.triggerFn();
    };
    return Signal;
}());
exports.default = Signal;
//# sourceMappingURL=signal.js.map