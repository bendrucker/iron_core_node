'use strict';

var expect = require('../expect');
var sinon  = require('sinon');
var fs     = require('fs');
var config = require('../../src/config');

describe('config', function () {

  var sandbox = sinon.sandbox.create();
  afterEach(function () {
    sandbox.restore();
  });

  describe('#file', function () {

    function stubFile (data, json) {
      if (json !== false) json = true;
      sandbox.stub(fs, 'readFileSync')
        .returns(new Buffer(json ? JSON.stringify(data) : data));
    }

    it('returns expected root values', function () {
      var data = {
        project_id: 'pid',
        token: 'tok'
      };
      stubFile(data);
      expect(config.file()).to.deep.equal(data);
    });

    it('excludes unexpected root values', function () {
      stubFile({
        foo: 'bar'
      });
      expect(config.file()).to.be.empty;
    });

    it('overrides with product values', function () {
      config.product = 'iron_mq';
      stubFile({
        token: 'rootToken',
        iron_mq: {
          token: 'mqToken'
        }
      });
      expect(config.file()).to.have.property('token', 'mqToken');
    });

    it('exludes unexpected product values', function () {
      config.product = 'iron_mq';
      stubFile({
        iron_mq: {
          foo: 'bar'
        }
      });
      expect(config.file()).to.be.empty;
    });

    it('returns undefined for invalid JSON', function () {
      sandbox.spy(JSON, 'parse');
      stubFile('Not JSON', false);
      expect(config.file()).to.be.undefined;
      expect(JSON.parse).to.have.thrown();
    });

  });

});