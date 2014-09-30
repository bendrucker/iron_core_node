'use strict';

var Promise     = require('bluebird');
var needle      = Promise.promisifyAll(require('needle'));
var createError = require('create-error');
var internals   = {};

function IronClient (options) {}

var IronError = createError('IronError');

internals.request = function () {
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
  return internals.request.apply(arguments);
};
