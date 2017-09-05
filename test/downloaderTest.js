var mock_fs = require('mock-fs');
var fs = require('fs');
var PassThrough = require('stream').PassThrough;
var colog = require('colog');
var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var fixtures = require('./helpers/fixtures');

var api = require('../lib/api');
var dl = require('../lib/downloader');

colog.silent(true);

describe('downloader', function() {
  var responseStream;
  beforeEach(function() {
    mock_fs();
    responseStream = new PassThrough();
    responseStream.write('RESPONSE DATA');
    sinon.stub(api, 'download').returns(responseStream);
  });
  afterEach(function() {
    mock_fs.restore();
    api.download.restore();
  });
  describe('.donwload()', function() {
    describe('calls api.CDNJS', function() {
      it('for the latest version if none specified', function() {
        dl.download(fixtures.jquery, undefined, '');
        expect(api.download).to.have.been.calledWith('jquery', '4.4.4', 'file1-4.4.4.js');
        expect(api.download).to.have.been.calledWith('jquery', '4.4.4', 'file2-4.4.4.js');
        expect(api.download).to.have.been.calledTwice;
      });
      it('for the specified version', function() {
        dl.download(fixtures.jquery, '3.3.3', '');
        expect(api.download).to.have.been.calledWith('jquery', '3.3.3', 'file1-3.3.3.js');
        expect(api.download).to.have.been.calledWith('jquery', '3.3.3', 'file2-3.3.3.js');
      });
      it('with semver support', function() {
        dl.download(fixtures.jquery, '<4', '');
        expect(api.download).to.have.been.calledWith('jquery', '3.3.3', 'file1-3.3.3.js');
        expect(api.download).to.have.been.calledWith('jquery', '3.3.3', 'file2-3.3.3.js');
      });
      it('doesn\'t call when no matching versions', function() {
        try { dl.download(fixtures.jquery, '<3', ''); } catch (err) {}
        expect(api.download).to.not.have.been.called;
        // TODO this should not log to console
      });
      it('with "latest" file when minimal option is given', function() {
        dl.download(fixtures.jquery, '', '', true);
        expect(api.download).to.have.been.calledWith('jquery', '4.4.4', 'latest.js');
        expect(api.download).to.have.been.calledOnce;
      });
      it('semver compatibly when minimal option is giving', function() {
        dl.download(fixtures.jquery, '<4', '', true);
        expect(api.download).to.have.been.calledWith('jquery', '3.3.3', 'latest.js');
        expect(api.download).to.have.been.calledOnce;
      });
    });
    describe('interacts with the file system', function() {
      describe('on#response', function() {
        context('200 OK', function() {
          it('saves all files to disk', function() {
            dl.download(fixtures.jquery, undefined, '');
            responseStream.emit('response', {statusCode: 200});
            var expected = ['file1-4.4.4.js', 'file2-4.4.4.js'];
            expect(fs.readdirSync('')).to.eql(expected);
          });
          it('creates dirs if necessary', function() {
            dl.download(fixtures.jquery, '4.1.1', '');
            responseStream.emit('response', {statusCode: 200});
            expect(fs.readdirSync('')).to.eql(['css', 'js']);
            expect(fs.readdirSync('js')).to.eql(['file1-4.1.1.js']);
            expect(fs.readdirSync('css')).to.eql(['file2-4.1.1.js']);
          });
          it('creates all files in specified output dir', function() {
            dl.download(fixtures.jquery, undefined, 'someDir');
            responseStream.emit('response', {statusCode: 200});
            expect(fs.readdirSync('')).to.eql(['someDir']);
            var expected = ['file1-4.4.4.js', 'file2-4.4.4.js'];
            expect(fs.readdirSync('someDir')).to.eql(expected);
          });
          it('creates all folders recursively', function() {
            dl.download(fixtures.jquery, '4.1.1', 'someDir');
            responseStream.emit('response', {statusCode: 200});
            expect(fs.readdirSync('')).to.eql(['someDir']);
            var expected = ['css', 'js'];
            expect(fs.readdirSync('someDir')).to.eql(expected);
          });
          it('saves the one file to disk when minimal is specified', function() {
            dl.download(fixtures.jquery, '4.1.1', '', true);
            responseStream.emit('response', {statusCode: 200});
            expect(fs.readdirSync('')).to.eql(['latest.js']);
          });
          it('sets the correct file content', function(done) {
            dl.download(fixtures.jquery, '4.4.4', '');
            responseStream.emit('response', {statusCode: 200});
            process.nextTick(function() {
              expect(fs.readFileSync('file1-4.4.4.js', 'utf8')).to.equal('RESPONSE DATA');
              done();
            });
          });
        }); // End of 200 OK
        context('404 NOT FOUND', function() {
          before(function() {
            sinon.stub(console, 'error');
          });
          after(function() {
            console.error.restore();
          });
          it('doesn\'t create the files', function() {
            dl.download(fixtures.jquery, '4.1.1', '');
            responseStream.emit('response', {statusCode: 404});
            expect(fs.readdirSync('')).to.be.empty;
          });
          it('doesn\'t create the given outputDir', function() {
            dl.download(fixtures.jquery, '', 'someDir');
            responseStream.emit('response', {statusCode: 404});
            expect(fs.existsSync('someDir')).to.be.false;
          });
          it('doesn\'t create dirs for the downloaded files', function() {
            dl.download(fixtures.jquery, '4.1.1', '');
            responseStream.emit('response', {statusCode: 404});
            expect(fs.readdirSync('')).to.not.eql(['css', 'js']);
          });
          it('prints out the error', function() {
            dl.download(fixtures.jquery, '4.1.1', '');
            responseStream.emit('response', {
              statusCode: 404,
              statusMessage: 'not found'
            });
            var expectedErr1 = '404 not found - js/file1-4.1.1.js';
            var expectedErr2 = '404 not found - css/file2-4.1.1.js';
            expect(console.error).to.have.been.calledWith(expectedErr1);
            expect(console.error).to.have.been.calledWith(expectedErr2);
          });
        });
      });
      describe('on#error', function() {
        it('doesn\'t create the files', function() {
          dl.download(fixtures.jquery, '4.1.1', '');
          responseStream.emit('error');
          expect(fs.readdirSync('')).to.be.empty;
        });
        it('doesn\'t create the given outputDir', function() {
          dl.download(fixtures.jquery, '', 'someDir');
          responseStream.emit('error');
          expect(fs.existsSync('someDir')).to.be.false;
        });
        it('doesn\'t create dirs for the downloaded files', function() {
          dl.download(fixtures.jquery, '4.1.1', '');
          responseStream.emit('error');
          expect(fs.readdirSync('')).to.not.eql(['css', 'js']);
        });
        it('prints out the error', function() {
          sinon.stub(console, 'error');
          dl.download(fixtures.jquery, '4.1.1', '');
          responseStream.emit('error', 'ERRORMESSAGE');
          expect(console.error).to.have.been.calledWith('ERRORMESSAGE');
          console.error.restore();
        });
      });
    });
  });
});
