var Q = require('q');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var fixtures = require('./helpers/fixtures');

var store = require('../lib/store');
var prompt = require('../lib/prompt');

describe('Store', function() {
  before(function() {
    sinon.stub(store, '_call').callsFake(function fakeCdnRequest(url) {
      var resBody = url.match(/jquery/i) ? {results: [fixtures.jquery]}
        : url.match(/underscore/i) ? {results: [fixtures.underscore]}
        : url.match(/ember/i) ? {results: [fixtures.ember, fixtures.emberFire]}
        : {results: []};
      var res = ['200 ok', JSON.stringify(resBody)];
      return Q(res);
    });
  });
  after(function() {
    store._call.restore();
  });
  describe('.findCollection()', function() {
    it('returns a promise for lib objects', function() {
      return store.findCollection('jquery')
        .then(function(collection) {
          var package = collection[0];
          expect(package.name).to.equal('jquery');
        });
    });
    it('includes dependencies in the dls', function() {
      return store.findCollection('ember')
        .then(function(collection) {
          var ember = collection[0];
          expect(ember.dependencies).to.have.a.property('underscore');
        });
    });
  });
  describe('.findMatching()', function() {
    it('returns only one library', function() {
      return store.findMatching('jquery')
        .then(function(matches) {
          expect(matches.length).to.eql(1);
        });
    });
    it('returns empty array if no match', function() {
      return store.findMatching('nothingwillmatchthis')
        .then(function(matches) {
          expect(matches.length).to.eq(0);
        });
    });
    it('returns multiple if no exact match', function() {
      return store.findMatching('ember')
        .then(function(matches) {
          expect(matches.length).to.be.above(1);
        });
    });
  });
  describe('.getDependentPackages()', function() {
    beforeEach(function() {
      sinon.stub(prompt, 'YN').returns(Q(true));
      sinon.stub(prompt, 'options').returns(Q(0));
    });
    afterEach(function() {
      prompt.YN.restore();
      prompt.options.restore();
    });
    it('returns an array of dependent packages', function() {
      return store.getDependentPackages(fixtures.ember)
        .then(function(found) {
          expect(found.length).to.eql(2);
          expect(found[0].name).to.equal('jquery');
          expect(found[1].name).to.equal('underscore.js');
        });
    });
    it('returns an empty array if no dependent packages', function() {
      return store.getDependentPackages(fixtures.jquery)
        .then(function(res) {
          expect(res).to.be.empty;
        });
    });
    it('asks the user if there are dependencies', function() {
      return store.getDependentPackages(fixtures.ember)
        .then(function(res) {
          expect(prompt.YN).to.have.been.calledWith('Would you like to install them?');
        });
    })
    it('doesn\'t ask shit if no dependencies', function() {
      return store.getDependentPackages(fixtures.jquery)
        .then(function(res) {
          expect(prompt.YN).to.not.have.been.called;
        });
    });
    it('sets the depVersion property to the one specified by the dependency', function() {
      return store.getDependentPackages(fixtures.ember)
        .then(function(res) {
          expect(res[0].depVersion).to.equal('3.2.1');
          expect(res[1].depVersion).to.equal('1.2.3');
        });
    })
  });
});
