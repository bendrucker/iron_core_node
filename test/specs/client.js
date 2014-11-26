var expect  = require('../expect');
var needle  = require('needle');
var sinon   = require('sinon');
var Promise = require('bluebird');
var Client  = require('../../src/client');

describe('IronClient', function () {

  var client;
  beforeEach(function () {
    client = new Client('product', {
      scheme: 'https',
      host: 'iron',
      port: 443
    });
  });

  describe('#base', function () {

    it('generates a url from the scheme, host, and port', function () {
      expect(client.base()).to.equal('https://iron:443');
    });

  });

  describe('#request', function () {

    it('performs exponential backoff until a maximum retry limit', function () {
      sinon.stub(needle, 'request')
        .yields(null, {statusCode: 503}, null);
      client.maxRetries = 2;
      client.retryDelay = 10;
      var request = client.request().reflect();
      expect(needle.request).to.have.been.calledOnce;
      return Promise
        .delay(15)
        .then(function () {
          expect(request.isPending()).to.be.true;
          expect(needle.request).to.have.been.calledTwice;
        })
        .delay(25)
        .then(function () {
          expect(needle.request).to.have.been.calledThrice;
          return request;
        })
        .then(function (request) {
          expect(request.isRejected()).to.be.true;
        })
        .finally(function () {
          needle.request.restore();
        });
    });

  });

});
