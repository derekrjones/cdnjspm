var expect = require('chai').expect;

var link = require('../lib/helpers/link');

describe('link', function() {
  describe('.scriptTag()', function() {
    it('gives the correct script tag for js files', function() {
      var tag = link.HTML('jquery', '2.1.4', 'jquery.min.js');
      var url = '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js';
      expect(tag).to.equal('<script type="text/javascript" src="' + url + '"></script>');
    });
    it('gives the correct script tag for css files', function() {
      var tag = link.HTML('bootstrap', '1.1.1', 'bootstrap.min.css');
      var url = '//cdnjs.cloudflare.com/ajax/libs/bootstrap/1.1.1/bootstrap.min.css';
      expect(tag).to.equal('<link rel="stylesheet" href="' + url + '">');
    });
    it('returns nothing for files that aren\'t js of css', function() {
      var tag = link.HTML('bootstrap', '1.1.1', 'bootstrap.svg');
      expect(tag).to.be.undefined;
    });
  }); // End of .scriptTag();
  describe('.file()', function() {
    it('returns the correct url', function() {
      var res = link.toFile('jquery', '2.1.4', 'jquery.min.js');
      var url = 'http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js';
      expect(res).to.equal(url);
    });
  });
  describe('.search()', function() {
    it('returns a api request url for finding a certain pkg', function() {
      var res = link.apiSearch('jquery');
      var url = 'http://api.cdnjs.com/libraries?search=jquery&fields=version,description,assets,dependencies';
      expect(res).to.equal(url);
    });
  });
});
