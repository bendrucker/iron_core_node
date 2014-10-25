'use strict';

var Promise     = require('bluebird');
var needle      = Promise.promisifyAll(require('needle'));
var createError = require('create-error');
var pkg         = require('../package.json');

function IronClient () {}

var IronError = createError('IronError');

function request () {
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

}

IronClient.prototype.maxRetries = 5;
// initial retry delay 
IronClient.prototype.retryDelay = 100;

function retryFilter (retries, max) {
  return function (err) {
    return retries < max && err.statusCode && err.statusCode === 503;
  };
}

IronClient.prototype.request = function () {
  // arguments: method, url, data, options
  var self    = this;
  var args    = arguments;
  var retries = 0;
  var max     = this.maxRetries;
  var delay   = this.retryDelay;

  function attemptRequest () {
    return request.apply(null, args)
      .catch(retryFilter(retries, max), function () {
        delay = self.retryDelay * Math.pow(2, retries);
        retries++;
        return Promise.delay(delay).then(function () {
          return attemptRequest.apply(null, args)
        });
      });
  }
  return attemptRequest();
};

IronClient.prototype.version = pkg.version;

Object.defineProperty(IronClient.prototype, 'headers', {
  get: function () {
    return 'iron-node/v' + this.version;
  }
});

module.exports = IronClient;
