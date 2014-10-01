'use strict';

var _         = require('lodash');
var fs        = require('fs');
var user      = require('passwd-user');
var internals = {};
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
      _.pick(data[internals.product], values)
    );
  }
  catch (e) {}
};

function envify (parts) {
  return parts.join('_').toUpperCase();
}

exports.env = function () {
  values
    .reduce(function (value, search) {
      search.push({
        configKey: value,
        envKey: envify([prefix, value])
      },
      {
        configKey: value,
        envKey: envify([prefix, internals.product, value])
      });
      return search;
    }, [])
    .reduce(function (pair, config) {
      config[pair.configKey] = config[pair.configKey] || process.env[pair.envKey];
      return config;
    }, {});
};


exports.load = function (product, overrides) {
  internals.product = product;
  return _.extend(
    {},
    exports.file(user.sync(process.getuid()).homedir),
    exports.env(),
    exports.file(process.cwd() + '/iron.json'),
    overrides
  );
};
