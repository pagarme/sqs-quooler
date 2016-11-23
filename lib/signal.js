"use strict";
const Bluebird = require('bluebird');
class Signal {
    constructor() {
        let self = this;
        this.promise = new Bluebird((resolve) => {
            self.triggerFn = resolve;
        });
    }
    trigger() {
        this.triggerFn();
    }
}
exports.Signal = Signal;
