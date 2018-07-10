'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Queue = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _awsSdk = require('aws-sdk');

var _bluebird = require('bluebird');

var Bluebird = _interopRequireWildcard(_bluebird);

var _events = require('events');

var _signal = require('./signal');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Queue = exports.Queue = function (_EventEmitter) {
  _inherits(Queue, _EventEmitter);

  function Queue(options) {
    _classCallCheck(this, Queue);

    var _this = _possibleConstructorReturn(this, (Queue.__proto__ || Object.getPrototypeOf(Queue)).call(this));

    _this.options = options;
    return _this;
  }

  _createClass(Queue, [{
    key: 'push',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(item) {
        var parameters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.options.sqs.sendMessage(Object.assign({}, {
                  QueueUrl: this.options.endpoint,
                  MessageBody: JSON.stringify(item)
                }, parameters)).promise();

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function push(_x2) {
        return _ref.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(message) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.options.sqs.deleteMessage({
                  QueueUrl: this.options.endpoint,
                  ReceiptHandle: message.ReceiptHandle
                }).promise();

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function remove(_x3) {
        return _ref2.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'startProcessing',
    value: function startProcessing(handler, options) {
      var self = this;

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
        }).promise()).get('Messages').then(coerce).map(processItem).tap(delay).then(runAgain).catch(handleCriticalError);
      }

      function processItem(message) {
        var body = JSON.parse(message.Body);

        return Bluebird.resolve([body, message]).spread(handler).then(deleteMessage).catch(handleError);

        function deleteMessage() {
          if (options.keepMessages) {
            return;
          }

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

      function handleCriticalError(err) {
        self.emit('error', err);

        return Bluebird.delay(100).then(pollItems);
      }
    }
  }, {
    key: 'stopProcessing',
    value: function stopProcessing() {
      var self = this;

      if (!this.running) {
        return this.stopped.promise;
      }

      this.running = false;
      this.stopped = new _signal.Signal();

      return this.stopped.promise;
    }
  }]);

  return Queue;
}(_events.EventEmitter);