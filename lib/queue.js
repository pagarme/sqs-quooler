'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _signal = require('./signal');

var _signal2 = _interopRequireDefault(_signal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Queue = function (_EventEmitter) {
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
    key: 'changeMessageVisibility',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var parameters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.options.sqs.changeMessageVisibility(Object.assign({}, {
                  QueueUrl: this.options.endpoint
                }, parameters)).promise();

              case 2:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function changeMessageVisibility() {
        return _ref3.apply(this, arguments);
      }

      return changeMessageVisibility;
    }()
  }, {
    key: 'startProcessing',
    value: function startProcessing(handler) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var self = this;

      self.running = true;

      var processItem = function processItem(message) {
        var body = '';
        try {
          body = JSON.parse(message.Body);
        } catch (e) {
          body = message.Body;
        }

        var deleteMessage = function deleteMessage() {
          if (options.keepMessages) {
            return _bluebird2.default.resolve();
          }

          return self.options.sqs.deleteMessage({
            QueueUrl: self.options.endpoint,
            ReceiptHandle: message.ReceiptHandle
          }).promise();
        };

        var handleError = function handleError(err) {
          self.emit('error', err);
        };

        return _bluebird2.default.resolve([body, message]).spread(handler).then(deleteMessage).catch(handleError);
      };

      var coerce = function coerce(x) {
        return x || [];
      };

      var delay = function delay(items) {
        if (items.length === 0) {
          return _bluebird2.default.delay(100);
        }

        return _bluebird2.default.resolve();
      };

      var pollItems = function pollItems() {
        if (!self.running) {
          self.stopped.trigger();

          return Promise.resolve();
        }

        var runAgain = function runAgain(items) {
          if (options.oneShot) {
            if (items.length < self.options.concurrency) {
              return _bluebird2.default.resolve();
            }

            return pollItems();
          }

          // Async call without return to avoid memory leak
          pollItems();
          return _bluebird2.default.resolve();
        };

        var handleCriticalError = function handleCriticalError(err) {
          self.emit('error', err);

          return _bluebird2.default.delay(100).then(pollItems);
        };

        return _bluebird2.default.resolve(self.options.sqs.receiveMessage({
          QueueUrl: self.options.endpoint,
          MaxNumberOfMessages: self.options.concurrency,
          MessageAttributeNames: options.messageAttributeNames || ['All'],
          AttributeNames: options.attributeNames || ['All']
        }).promise()).get('Messages').then(coerce).map(processItem).tap(delay).then(runAgain).catch(handleCriticalError);
      };

      return pollItems();
    }
  }, {
    key: 'stopProcessing',
    value: function stopProcessing() {
      if (!this.running) {
        return this.stopped.promise;
      }

      this.running = false;
      this.stopped = new _signal2.default();

      return this.stopped.promise;
    }
  }, {
    key: 'purge',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.options.sqs.purgeQueue({
                  QueueUrl: this.options.endpoint
                }).promise();

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function purge() {
        return _ref4.apply(this, arguments);
      }

      return purge;
    }()
  }]);

  return Queue;
}(_events.EventEmitter);

exports.default = Queue;
