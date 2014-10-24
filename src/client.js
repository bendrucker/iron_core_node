'use strict';

var Promise     = require('bluebird');
var needle      = Promise.promisifyAll(require('needle'));
var createError = require('create-error');
var pkg         = require('./pkg');

function IronClient () {}

var IronError = createError('IronError');

function request = function () {
  // arguments: method, url, data, options
  return needle.requestAsync.apply(needle, arguments)
    .spread(function (response) {
      if (response.statusCode >= 400) {
        throw new IronError(response.body ? response.body.msg : void 0, {
          statusCode: response.statusCode,
          body: response.body
        });
      }
      else {
        return response.body;
      }
    });

};

IronClient.prototype.request = function () {
  // arguments: method, url, data, options
  return request.apply(null, arguments);
};

IronClient.prototype.version = pkg.version

Object.defineProperty(IronClient.prototype, 'headers', {
  get: function () {
    return 'iron-node/v' + this.version
  }
});
