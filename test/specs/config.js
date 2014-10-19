'use strict';

var expect  = require('../expect');
var sinon   = require('sinon');
var fs      = require('fs');
var tildify = require('tildify');
var path    = require('path');
var config  = require('../../src/config');

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
      config.product = 'mq';
      stubFile({
        token: 'rootToken',
        iron_mq: {
          token: 'mqToken'
        }
      });
      expect(config.file()).to.have.property('token', 'mqToken');
    });

    it('exludes unexpected product values', function () {
      config.product = 'mq';
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

  describe('#env', function () {

    var original = process.env;
    afterEach(function () {
      process.env = original;
    });

    it('returns expected global values', function () {
      process.env = {
        IRON_TOKEN: 'tok',
        IRON_PROJECT_ID: 'pid'
      };
      expect(config.env()).to.deep.equal({
        token: 'tok',
        project_id: 'pid'
      });
    });

    it('overrides globals with product values', function () {
      config.product = 'mq';
      process.env = {
        IRON_TOKEN: 'global',
        IRON_MQ_TOKEN: 'product'
      };
      expect(config.env()).to.deep.equal({
        token: 'product'
      });
    });

  });

  describe('#load', function () {

    beforeEach(function () {
      sandbox.stub(config, 'file');
    });

    it('loads .iron.json from the home directory', function () {
      config.load();
      expect(tildify(config.file.firstCall.args[0]))
        .to.equal('~/.iron.json');
    });

    it('loads iron.json from the working directory', function () {
      config.load();
      expect(config.file)
        .to.have.been.calledWith(path.resolve('./iron.json'));
    });

  });

});