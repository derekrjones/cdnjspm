var expect = require('chai').expect;

var fixtures = require('./helpers/fixtures');

var extract = require('../lib/helpers/extract');

describe('extract', function() {
  describe('.asset()', function() {
    it('returns an asset object of the correct version', function() {
      var asset = extract.asset(fixtures.jquery, '4.1.1');
      expect(asset).to.eql({
        version: '4.1.1',
        files: ['js/file1-4.1.1.js', 'css/file2-4.1.1.js']
      });
    });
    it('is returns the correct asset semver compatibly', function() {
      var asset = extract.asset(fixtures.jquery, '<4');
      expect(asset).to.eql({
        version: '3.3.3',
        files: ['file1-3.3.3.js', 'file2-3.3.3.js']
      });
    });
    it('throws an error if no version found', function() {
      var fn = extract.asset.bind(undefined, fixtures.jquery, '>5');
      expect(fn).to.throw('Version not found');
    });
    it('works with non semver compatible packages', function() {
      var lib = {
        assets: [
          {version: '100'},
          {version: '95', files: [{name: 'file1'}, {name: 'file2'}]},
          {version: '88'}
        ]
      };
      var asset = extract.asset(lib, '95');
      expect(asset).to.eql({version: '95', files: [{name: 'file1'}, {name: 'file2'}]});
    });
  });
  describe('.nearestExistingVersion() returns the correct version', function() {
    it('when perfect match', function() {
      var version = extract.matchingVersion(fixtures.jquery, '4.4.4');
      expect(version).to.eql('4.4.4');
    });
    it('works with non semver compatible packages', function() {
      var lib = {assets: [{version: '100'}, {version: '95'}, {version: '88'}]};
      var version = extract.matchingVersion(lib, '95');
      expect(version).to.equal('95');
    });
  });
});
