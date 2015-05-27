var expect = require('chai').expect;
var store = require('../lib/store.js');

describe ('Store', function() {

  describe ('.buildUrl()', function() {

    it('returns the correct cdnjs api url', function() {
      var url = store.buildUrl("jquery");
      expect(url).to.equal("http://api.cdnjs.com/libraries?search=jquery&fields=version,description,assets,dependencies");
    });
  });

  describe ('.findCollection()', function() {

    it('returns a promise for lib objects', function() {
      var promise = store.findCollection('twitter-bootstrap');
      return promise.then( function(collection) {
        var package = collection[1];
        expect(package.name).to.equal("twitter-bootstrap");
      })
    });

    it('includes dependencies in the dls', function() {
      var promise = store.findCollection('react');
      return promise.then( function(collection) {
        var reactCoffee = collection[6];
        expect(reactCoffee.dependencies).to.have.a.property("underscore");
      });
    });

  });

  describe('.findMatchin()', function() {

    it('returns only one library', function() {
      var promise = store.findMatching("react");
      return promise.then( function(library) {
        expect(library.name).to.equal("react");
      });
    });

    it('returns nothing if no match', function() {
      var promise = store.findMatching("nothingwillmatchthis");
      return promise.then( function(response) {
        expect(response).to.not.exist;
      });
    });

    it('returns multiple if no exact match', function() {
      var promise = store.findMatching("underscore");
      return promise.then( function(matches) {
        expect(matches.length).to.be.above(1);
      })
    });

  });

  describe ('.getDependentPackages()', function() {

    it.only('returns an array of dependent packages', function() {
      var lib = { name: "react-coffee",
                  dependencies: { jquery: "3.2.1", underscore: "2.1.1" } };
      var promise = store.getDependentPackages(lib);
      var stdin = require('mock-stdin').stdin();
      // process.nextTick(function mockResponse() {
      //   stdin.send('y');
      // });
      return promise.then( function(dependentpackages) {
        // var expected = [ "jquery", "underscore" ];
        // var found = dependentPackages.map(function(i) { return i.name});
        // expect(found).to.equal(expect);
      })
    });
  });

});