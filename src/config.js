'use strict';

var _         = require('lodash');
var fs        = require('fs');
var untildify = require('untildify');
var prefix    = 'iron';
var values    = [
  'project_id',
  'token',
  'host',
  'protocol',
  'port',
  'api_version'
];

exports.file = function (path) {
  try {
    var data = JSON.parse(fs.readFileSync(path));
    return _.extend(
      _.pick(data, values),
      _.pick(data[prefix + '_' + this.product], values)
    );
  }
  catch (e) {}
};

function envify (parts) {
  return parts.join('_').toUpperCase();
}

exports.env = function () {
  var self = this;
  return values
    .reduce(function (search, value) {
      search.push({
        configKey: value,
        envKey: envify([prefix, value])
      },
      {
        configKey: value,
        envKey: envify([prefix, self.product, value])
      });
      return search;
    }, [])
    .reduce(function (config, pair) {
      var envValue = process.env[pair.envKey];
      if (typeof envValue !== 'undefined') {
        config[pair.configKey] = envValue;
      }
      return config;
    }, {});
};


exports.load = function (product, overrides) {
  var self = {
    product: product
  };
  return _.extend(
    {},
    exports.file.call(self, untildify('~/.iron.json')),
    exports.env.call(self),
    exports.file.call(self, process.cwd() + '/iron.json'),
    overrides
  );
};
