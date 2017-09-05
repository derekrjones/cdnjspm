var fs = require('fs');
var path = require('path');
var colog = require('colog');
var mkdirp = require('mkdirp');
var semver = require('semver');

var api = require('./api');
var extract = require('./helpers/extract');

module.exports = {
  download: download
}

// handles the download of a single lib
function download(lib, version, destination, minimal) {
  var version = version || lib.version;
  var asset = extract.asset(lib, version);
  if (minimal) {
    colog.progress(0, 1);
    downloadMainFile(lib, asset.version, destination);
    return;
  }
  colog.progress(0, asset.files.length);
  asset.files.forEach(function(file) {
    downloadFile(lib.name, asset.version, file, destination);
  })
}

// This function downloads the one file marked as 'latest' by CDNJS
function downloadMainFile(lib, version, destination) {
  var fileName = lib.latest.split('/').slice(-1)[0];
  downloadFile(lib.name, version, fileName, destination);
}

function downloadFile(name, version, file, targetDir) {
  var dir = targetDir || "";
  var outputPath = path.join(dir, file);

  // Pipe data to writeStream if 200 OK
  var stream = api.download(name, version, file);
  stream.on("error", console.error);
  stream.on('response', function(res) {
    if (res.statusCode == 200) {
      makeDirs();
      stream.pipe(fs.createWriteStream(outputPath));
      colog.success("Download success! " + outputPath);
      colog.progress(1, null, null, "DL");
    } else {
      console.error(res.statusCode + " " + res.statusMessage + " - " + file);
    }
  });

  function makeDirs() {
    var recDir = path.join(dir, path.dirname(file));
    if (!fs.existsSync(recDir)) mkdirp.sync(recDir);
  }
}
