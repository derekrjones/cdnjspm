var Q = require('q');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var fixtures = require('./helpers/fixtures');

var app = require('../cli');
var api = require('../lib/api');
var dl = require('../lib/downloader');
var prompt = require('../lib/prompt');
var store = require('../lib/store');

describe('CLI', function() {
  beforeEach(function() {
    sinon.stub(api, 'search')
      .callsFake(function fakeCdnRequest(url) {
        var res = url.match(/jquery/i) ? [fixtures.jquery]
          : url.match(/underscore/i) ? [fixtures.underscore]
          : url.match(/ember/i) ? [fixtures.ember, fixtures.emberFire]
          : []
        return Q(res);
      });
  });
  afterEach(function() {
    api.search.restore();
  });
  describe('parseArgs', function() {
    it('has the correct defaults', function() {
      var opts = app.parseArgs({_: []});
      var expected = {
        query: undefined,
        showHelp: false,
        destination: '',
        version: undefined,
        silent: false,
        minimal: false,
        printHTML: false
      };
      expect(opts).to.eql(expected);
    });
    it('parses the requested package name', function() {
      var opts = app.parseArgs({_: ['ember']});
      expect(opts.query).to.equal('ember');
    });
    it('parses -o as destination', function() {
      var opts = app.parseArgs({_: [], o: 'lib/deps'});
      expect(opts.destination).to.equal('lib/deps');
    });
    it('parses -v as version', function() {
      var opts = app.parseArgs({_: [], v: '<=2.1.1'});
      expect(opts.version).to.equal('<=2.1.1');
    });
    it('parses -m as minimal', function() {
      var opts = app.parseArgs({_: [], m: true});
      expect(opts.minimal).to.be.true;
    })
    it('parses -h as showHelp', function() {
      var opts = app.parseArgs({_: [], h: true});
      expect(opts.showHelp).to.be.true;
    });
    it('parses -s as silent', function() {
      var opts = app.parseArgs({_: [], s: true});
      expect(opts.silent).to.be.true;
    });
    it('parses -t as printHTML', function() {
      var opts = app.parseArgs({_: [], t: true});
      expect(opts.printHTML).to.be.true;
    });
    it('understands --output', function() {
      var opts = app.parseArgs({_: [], output: 'lib/deps'});
      expect(opts.destination).to.equal('lib/deps');
    });
    it('understands --version', function() {
      var opts = app.parseArgs({_: [], version: '<=2.1.1'});
      expect(opts.version).to.equal('<=2.1.1');
    });
    it('understands --help', function() {
      var opts = app.parseArgs({_: [], help: true});
      expect(opts.showHelp).to.be.true;
    });
    it('understands --silent', function() {
      var opts = app.parseArgs({_: [], silent: true});
      expect(opts.silent).to.be.true;
    });
    it('understands --minimal', function() {
      var opts = app.parseArgs({_: [], minimal: true});
      expect(opts.minimal).to.be.true;
    });
    it('understands --tag', function() {
      var opts = app.parseArgs({_: [], tag: true});
      expect(opts.printHTML).to.be.true;
    });
  });
  describe('parseArgs that logs', function() {
    beforeEach(function() {
      sinon.stub(console, 'log').returns(undefined);
    });
    afterEach(function() {
      console.log.restore();
    });
    it('calls the help page', function() {
      app.run({_: [], help: true});
      expect(console.log).to.have.callCount(17);
    });
    it('sets colog to silent mode', function() {
      var colog = require('colog');
      sinon.spy(colog, 'silent');
      app.run({_: ['jquery'], silent: true});
      expect(colog.silent).to.have.been.calledWith(true);
    });
  });
  describe('dispatch to store', function() {
    beforeEach(function() {
      sinon.spy(store, 'findMatching');
      sinon.stub(store, 'getDependentPackages').returns(Q([]));
    });
    afterEach(function() {
      store.findMatching.restore();
      store.getDependentPackages.restore();
    });
    it('asks store to find a match for query', function() {
      return app.run({_: ['jquery']})
        .finally(function() {
          expect(store.findMatching).to.have.been.calledWith('jquery');
        })
    });
    it('asks store to check for dependencies', function() {
      sinon.stub(prompt, 'options').returns(Q(0));
      return app.run({_: ['ember']})
        .finally(function() {
          expect(store.getDependentPackages).to.have.been.called;
          prompt.options.restore();
        })
    });
  });
  describe('prompt', function() {
    beforeEach(function() {
      sinon.stub(prompt, 'YN').returns(Q(false));
      sinon.stub(prompt, 'options').returns(Q(0));
    });
    afterEach(function() {
      prompt.options.restore();
      prompt.YN.restore();
    });
    it('prompts user when multiple found', function() {
      return app.run({_: ['ember']})
        .finally(function() {
          expect(prompt.options).to.have.been.called;
        })
    });
  });
  describe('dispatch to downloader', function() {
    beforeEach(function() {
      sinon.stub(prompt, 'options').returns(Q(0));
      sinon.stub(prompt, 'YN').returns(Q(true));
      sinon.stub(dl, 'download');
    });
    afterEach(function() {
      dl.download.restore();
      prompt.YN.restore();
      prompt.options.restore();
    });
    it('dispatches to downloader', function() {
      return app.run({_: ['jquery']})
        .finally(function() {
          expect(dl.download).to.have.been.calledWith(fixtures.jquery);
          expect(dl.download).to.have.been.calledOnce;
        });
    });
    it('dispatches downloads for dependencies', function() {
      return app.run({_: ['ember']})
        .finally(function() {
          expect(dl.download).to.have.been.calledWithMatch(fixtures.jquery);
          expect(dl.download).to.have.been.calledWithMatch(fixtures.underscore);
        });
    });
    it('passes on the outputDir', function() {
      return app.run({_: ['jquery'], o: 'lib/deps'})
        .finally(function() {
          expect(dl.download).to.have.been.calledWith(fixtures.jquery, undefined, 'lib/deps');
        });
    });
    it('passes on output dir on dependency dl dispatch', function() {
      return app.run({_: ['ember'], o: 'lib/deps'})
        .finally(function() {
          expect(dl.download).to.have.been.calledWithMatch(fixtures.jquery, '', 'lib/deps');
          expect(dl.download).to.have.been.calledWithMatch(fixtures.underscore, '', 'lib/deps');
        });
    });
    it('passes on the version if any', function() {
      return app.run({_: ['jquery'], v: '1.2.3'})
        .finally(function() {
          expect(dl.download).to.have.been.calledWith(fixtures.jquery, '1.2.3');
        });
    });
    it('passes on the correct versions of dependencies', function() {
      return app.run({_: ['ember']})
        .finally(function() {
          expect(dl.download).to.have.been.calledWithMatch(fixtures.underscore, '1.2.3');
          expect(dl.download).to.have.been.calledWithMatch(fixtures.jquery, '3.2.1');
        });
    });
    it('passes on true if minimal flag is set', function() {
      return app.run({_: ['jquery'], m: true})
        .finally(function() {
          expect(dl.download).to.have.been.calledWith(fixtures.jquery, undefined, '', true);
        });
    });
    it('it passes on the minimal flag to deps downloads', function() {
      return app.run({_: ['ember'], m: true})
        .finally(function() {
          expect(dl.download).to.have.been.calledWithMatch(fixtures.underscore, '1.2.3', '', true);
          expect(dl.download).to.have.been.calledWithMatch(fixtures.jquery, '3.2.1', '', true);
        });
    });
  });
  describe('--tag', function() {
    beforeEach(function() {
      sinon.spy(console, 'log');
    });
    afterEach(function() {
      console.log.restore();
    });
    it('doesn\'t execute a download', function() {
      sinon.stub(dl, 'download');
      return app.run({_: ['jquery'], t: true})
        .finally(function() {
          expect(dl.download).to.not.have.been.called;
          dl.download.restore();
        });
    });
    it('prints out script tags', function() {
      return app.run({_: ['jquery'], t: true})
        .finally(function() {
          expectTagPrintedFor('jquery', '4.4.4', 'file1-4.4.4.js');
          expectTagPrintedFor('jquery', '4.4.4', 'file2-4.4.4.js');
        });
    });
    it('spits out a single tag for the latest file with -m', function() {
      return app.run({_: ['jquery'], t: true, m: true})
        .finally(function() {
          expectTagPrintedFor('jquery', '4.4.4', 'latest.js');
        });
    });
    it('spits out script tags with correct version', function() {
      return app.run({_: ['jquery'], t: true, v: '<4'})
        .finally(function() {
          expectTagPrintedFor('jquery', '3.3.3', 'file1-3.3.3.js');
          expectTagPrintedFor('jquery', '3.3.3', 'file2-3.3.3.js');
        });
    });
    it('spits out the correct versionned script tag with -m', function() {
      return app.run({_: ['jquery'], t: true, v: '<4', m: true})
        .finally(function() {
          expectTagPrintedFor('jquery', '3.3.3', 'latest.js');
        });
    });
    function expectTagPrintedFor(pkgName, version, filename) {
      var url = '//cdnjs.cloudflare.com/ajax/libs/{{name}}/{{version}}/{{filename}}';
      var genericTag = '<script type="text/javascript" src="' + url + '"></script>';
      var tag = genericTag
        .replace('{{name}}', pkgName)
        .replace('{{version}}', version)
        .replace('{{filename}}', filename);
      expect(console.log).to.have.been.calledWith(tag);
    }
  });
});
