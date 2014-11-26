'use strict';

var Promise     = require('bluebird');
var needle      = Promise.promisifyAll(require('needle'));
var createError = require('create-error');
var util        = require('util');
var config      = require('./config');

function IronClient (product, options) {
  this.product = product;
  this.config  = config.load(product, options);
}

IronClient.IronError = createError('IronError');

IronClient.prototype.base = function () {
  return util.format('%s://%s:%d', this.config.scheme, this.config.host, this.config.port);
}

function request () {
  // arguments: method, url, data, options
  return needle.requestAsync.apply(needle, arguments)
    .spread(function (response) {
      if (response.statusCode >= 400) {
        throw new IronClient.IronError(response.body ? response.body.msg : 'Unknown error', {
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
        return Promise.delay(delay).then(attemptRequest);
      });
  }
  return attemptRequest();
};

module.exports = IronClient;
