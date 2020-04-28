'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Queue = undefined;

require('idempotent-babel-polyfill');

var _queue = require('./queue');

var _queue2 = _interopRequireDefault(_queue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-next-line import/prefer-default-export
exports.Queue = _queue2.default;