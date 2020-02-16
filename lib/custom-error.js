"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CustomError = function (_Error) {
  _inherits(CustomError, _Error);

  function CustomError() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        message = _ref.message,
        type = _ref.type;

    _classCallCheck(this, CustomError);

    var _this = _possibleConstructorReturn(this, (CustomError.__proto__ || Object.getPrototypeOf(CustomError)).call(this));

    _this.type = type;
    _this.message = message;
    return _this;
  }

  return CustomError;
}(Error);

exports.default = CustomError;