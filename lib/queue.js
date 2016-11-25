"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Bluebird = require('bluebird');
const events_1 = require('events');
const signal_1 = require('./signal');
class Queue extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }
    push(item) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.options.sqs.sendMessage({
                QueueUrl: this.options.endpoint,
                MessageBody: JSON.stringify(item)
            }).promise();
        });
    }
    startProcessing(handler, options) {
        let self = this;
        if (options == null) {
            options = {};
        }
        self.running = true;
        return pollItems();
        function pollItems() {
            if (!self.running) {
                self.stopped.trigger();
                return Promise.resolve();
            }
            return Bluebird.resolve(self.options.sqs.receiveMessage({
                QueueUrl: self.options.endpoint,
                MaxNumberOfMessages: self.options.concurrency
            }).promise())
                .get('Messages')
                .then(coerce)
                .map(processItem)
                .tap(delay)
                .then(runAgain);
        }
        function processItem(message) {
            let body = JSON.parse(message.Body);
            return Bluebird.resolve(body)
                .then(handler)
                .then(deleteMessage)
                .catch(handleError);
            function deleteMessage() {
                return self.options.sqs.deleteMessage({
                    QueueUrl: self.options.endpoint,
                    ReceiptHandle: message.ReceiptHandle
                }).promise();
            }
            function handleError(err) {
                self.emit('error', err);
            }
        }
        function coerce(x) {
            return x || [];
        }
        function delay(items) {
            if (items.length == 0) {
                return Bluebird.delay(100);
            }
        }
        function runAgain(items) {
            if (items.length < self.options.concurrency && options.oneShot) {
                return;
            }
            return pollItems();
        }
    }
    stopProcessing() {
        let self = this;
        if (!this.running) {
            return this.stopped.promise;
        }
        this.running = false;
        this.stopped = new signal_1.Signal();
        return this.stopped.promise;
    }
}
exports.Queue = Queue;
