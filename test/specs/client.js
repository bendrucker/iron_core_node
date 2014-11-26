var expect  = require('../expect');
var needle  = require('needle');
var sinon   = require('sinon');
var Promise = require('bluebird');
var nock    = require('nock');
var Client  = require('../../src/client');

describe('IronClient', function () {

  var mock;
  before(function () {
    mock = nock('https://iron');
  });

  after(nock.cleanAll.bind(nock));

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

    it('resolves the response', function () {
      mock
        .get('/')
        .reply(200, {
          foo: 'bar'
        });
      return client.request('get', client.base(), null, null)
        .then(function (data) {
          expect(data).to.deep.equal({foo: 'bar'});
        });
    });

    it('rejects with IronErrors', function () {
      mock
        .get('/')
        .reply(404, {
          msg: 'iron error'
        });
      return expect(client.request('get', client.base(), null, null))
        .to.be.rejected
        .then(function (err) {
          expect(err)
            .to.be.an.instanceOf(Client.IronError)
            .and.to.contain({
              message: 'iron error',
              statusCode: 404
            })
            .and.property('body')
            .that.deep.equals({msg: 'iron error'});
        });
    });

    it('handles malformed error responses', function () {
      mock
        .get('/')
        .reply(404, 'bad');
      return expect(client.request('get', client.base(), null, null))
        .to.be.rejectedWith('Unknown error');
    });

    it('performs exponential backoff until a maximum retry limit', function () {
      sinon.stub(needle, 'request')
        .yields(null, {statusCode: 503, body: ''}, '');
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
