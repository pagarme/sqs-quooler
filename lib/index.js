'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PrioritiesQueues = exports.Queue = undefined;

require('babel-polyfill');

var _queue = require('./queue');

var _queue2 = _interopRequireDefault(_queue);

var _prioritiesQueues = require('./priorities-queues');

var _prioritiesQueues2 = _interopRequireDefault(_prioritiesQueues);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line import/prefer-default-export
exports.Queue = _queue2.default;
exports.PrioritiesQueues = _prioritiesQueues2.default;