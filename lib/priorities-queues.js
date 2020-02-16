'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _events = require('events');

var _customError = require('./custom-error');

var _customError2 = _interopRequireDefault(_customError);

var _signal = require('./signal');

var _signal2 = _interopRequireDefault(_signal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PrioritiesQueues = function (_EventEmitter) {
  _inherits(PrioritiesQueues, _EventEmitter);

  function PrioritiesQueues(options) {
    _classCallCheck(this, PrioritiesQueues);

    var _this = _possibleConstructorReturn(this, (PrioritiesQueues.__proto__ || Object.getPrototypeOf(PrioritiesQueues)).call(this));

    if (!options) {
      throw new _customError2.default({
        type: 'missing parameter',
        message: 'This method requires an options as the first argument'
      });
    }

    if (!options.sqs) {
      throw new _customError2.default({
        type: 'missing parameter',
        message: 'This method requires options.sqs'
      });
    }

    if (!options.queues || !Object.keys(options.queues).length) {
      throw new _customError2.default({
        type: 'missing parameter',
        message: 'This method requires options.queues'
      });
    }

    if (!options.priorities || !options.priorities.length) {
      throw new _customError2.default({
        type: 'missing parameter',
        message: 'This method requires options.priorities'
      });
    }

    options.priorities.forEach(function (queueName) {
      if (!options.queues[queueName]) {
        throw new _customError2.default({
          type: 'invalid parameter',
          message: 'There are queues at priorities list that are not at the queues list'
        });
      }
    });

    _this.options = options;
    _this.customPriorities = [].concat(options.priorities);
    _this.prioritiesCount = options.priorities.reduce(function (result, priority) {
      // eslint-disable-next-line no-param-reassign
      result[priority] = 0;
      return result;
    }, {});

    _this.maxPriorityRetries = options.maxPriorityRetries || 5;
    return _this;
  }

  _createClass(PrioritiesQueues, [{
    key: 'push',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(item, queue) {
        var parameters = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (queue) {
                  _context.next = 2;
                  break;
                }

                throw new _customError2.default({
                  type: 'missing parameter',
                  message: 'This method requires a queue name as the second argument'
                });

              case 2:
                if (this.options.queues[queue]) {
                  _context.next = 4;
                  break;
                }

                throw new _customError2.default({
                  type: 'invalid parameter',
                  message: 'Invalid queue name provided, please select a valid queue'
                });

              case 4:
                return _context.abrupt('return', this.options.sqs.sendMessage(Object.assign({}, {
                  QueueUrl: this.options.queues[queue],
                  MessageBody: JSON.stringify(item)
                }, parameters)).promise());

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function push(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return push;
    }()
  }, {
    key: 'remove',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(message, queue) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (message) {
                  _context2.next = 2;
                  break;
                }

                throw new _customError2.default({
                  type: 'missing parameter',
                  message: 'This method requires a message as the first argument'
                });

              case 2:
                if (queue) {
                  _context2.next = 4;
                  break;
                }

                throw new _customError2.default({
                  type: 'missing parameter',
                  message: 'This method requires a queue name as the second argument'
                });

              case 4:
                if (message.ReceiptHandle) {
                  _context2.next = 6;
                  break;
                }

                throw new _customError2.default({
                  type: 'invalid parameter',
                  message: 'Invalid message provided, the message must include ReceiptHandle attribute'
                });

              case 6:
                if (this.options.queues[queue]) {
                  _context2.next = 8;
                  break;
                }

                throw new _customError2.default({
                  type: 'invalid parameter',
                  message: 'Invalid queue name provided, please select a valid queue'
                });

              case 8:
                return _context2.abrupt('return', this.options.sqs.deleteMessage({
                  QueueUrl: this.options.queues[queue],
                  ReceiptHandle: message.ReceiptHandle
                }).promise());

              case 9:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function remove(_x4, _x5) {
        return _ref2.apply(this, arguments);
      }

      return remove;
    }()
  }, {
    key: 'changeMessageVisibility',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var parameters = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var queue = arguments[1];
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (parameters) {
                  _context3.next = 2;
                  break;
                }

                throw new _customError2.default({
                  type: 'missing parameter',
                  message: 'This method requires a parameters object as the first argument'
                });

              case 2:
                if (queue) {
                  _context3.next = 4;
                  break;
                }

                throw new _customError2.default({
                  type: 'missing parameter',
                  message: 'This method requires a queue name as the second argument'
                });

              case 4:
                if (this.options.queues[queue]) {
                  _context3.next = 6;
                  break;
                }

                throw new _customError2.default({
                  type: 'invalid parameter',
                  message: 'Invalid queue name provided, please select a valid queue'
                });

              case 6:
                return _context3.abrupt('return', this.options.sqs.changeMessageVisibility(Object.assign({}, {
                  QueueUrl: this.options.queues[queue]
                }, parameters)).promise());

              case 7:
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

          return self.remove(message, message.queue);
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

        var runAgain = function runAgain() {
          if (options.oneShot) {
            return _bluebird2.default.resolve();
          }

          self.customPriorities = [].concat(self.options.priorities);

          return pollItems();
        };

        var handleCriticalError = function handleCriticalError(err) {
          self.emit('error', err);

          return _bluebird2.default.delay(100).then(pollItems);
        };

        var getMessages = function getMessages() {
          var priorityIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

          var queue = self.customPriorities[priorityIndex];

          if (!queue) {
            return [];
          }

          return _bluebird2.default.resolve().then(function () {
            return self.options.sqs.receiveMessage({
              QueueUrl: self.options.queues[queue],
              MaxNumberOfMessages: self.options.concurrency
            }).promise();
          }).get('Messages').then(coerce).then(function (itens) {
            if (itens.length) {
              return itens.map(function (item) {
                return Object.assign({}, item, { queue: queue });
              });
            }

            return getMessages(priorityIndex + 1);
          });
        };

        function checkPriorities() {
          var firstCustomPriority = self.customPriorities[0];

          if (self.prioritiesCount[firstCustomPriority] >= self.maxPriorityRetries) {
            self.customPriorities = self.customPriorities.concat(self.customPriorities.shift());
            self.prioritiesCount[firstCustomPriority] = 0;
          }

          var _self$customPrioritie = _slicedToArray(self.customPriorities, 1);

          firstCustomPriority = _self$customPrioritie[0];


          if (self.prioritiesCount[firstCustomPriority] >= self.maxPriorityRetries) {
            checkPriorities();
          }
        }

        checkPriorities();

        var firstCustomPriority = self.customPriorities[0];
        self.prioritiesCount[firstCustomPriority] += 1;

        return getMessages().map(processItem).tap(delay).then(runAgain).catch(handleCriticalError);
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
  }]);

  return PrioritiesQueues;
}(_events.EventEmitter);

exports.default = PrioritiesQueues;