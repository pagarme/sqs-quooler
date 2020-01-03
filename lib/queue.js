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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bluebird_1 = __importDefault(require("bluebird"));
var events_1 = require("events");
var signal_1 = __importDefault(require("./signal"));
var Queue = /** @class */ (function (_super) {
    __extends(Queue, _super);
    function Queue(options) {
        var _this = _super.call(this) || this;
        _this.options = options;
        return _this;
    }
    Queue.prototype.push = function (item, parameters) {
        if (parameters === void 0) { parameters = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.options.sqs
                            .sendMessage(__assign({ QueueUrl: this.options.endpoint, MessageBody: JSON.stringify(item) }, parameters))
                            .promise()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Queue.prototype.remove = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.options.sqs
                            .deleteMessage({
                            QueueUrl: this.options.endpoint,
                            ReceiptHandle: message.ReceiptHandle,
                        })
                            .promise()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Queue.prototype.changeMessageVisibility = function (parameters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.options.sqs
                            .changeMessageVisibility(__assign({ QueueUrl: this.options.endpoint }, parameters))
                            .promise()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Queue.prototype.startProcessing = function (handler, options) {
        if (options === void 0) { options = {}; }
        var self = this;
        self.running = true;
        var processItem = function (message) {
            var body = '';
            try {
                body = JSON.parse(message.Body);
            }
            catch (e) {
                body = message.Body;
            }
            var deleteMessage = function () {
                if (options.keepMessages) {
                    return bluebird_1.default.resolve();
                }
                return self.options.sqs
                    .deleteMessage({
                    QueueUrl: self.options.endpoint,
                    ReceiptHandle: message.ReceiptHandle,
                })
                    .promise();
            };
            var handleError = function (err) {
                self.emit('error', err);
            };
            return bluebird_1.default.resolve([body, message])
                .spread(handler)
                .then(deleteMessage)
                .catch(handleError);
        };
        var coerce = function (x) { return x || []; };
        var delay = function (items) {
            if (items.length === 0) {
                return bluebird_1.default.delay(100);
            }
            return bluebird_1.default.resolve();
        };
        var pollItems = function () {
            if (!self.running) {
                self.stopped.trigger();
                return bluebird_1.default.resolve();
            }
            var runAgain = function (items) {
                if (items.length < self.options.concurrency && options.oneShot) {
                    return bluebird_1.default.resolve();
                }
                return pollItems();
            };
            var handleCriticalError = function (err) {
                self.emit('error', err);
                return bluebird_1.default.delay(100).then(pollItems);
            };
            return bluebird_1.default.resolve(self.options.sqs
                .receiveMessage({
                QueueUrl: self.options.endpoint,
                MaxNumberOfMessages: self.options.concurrency,
            })
                .promise())
                .get('Messages')
                .then(coerce)
                .map(processItem)
                .tap(delay)
                .then(runAgain)
                .catch(handleCriticalError);
        };
        return pollItems();
    };
    Queue.prototype.stopProcessing = function () {
        if (!this.running) {
            return this.stopped.promise;
        }
        this.running = false;
        this.stopped = new signal_1.default();
        return this.stopped.promise;
    };
    return Queue;
}(events_1.EventEmitter));
exports.default = Queue;
//# sourceMappingURL=queue.js.map