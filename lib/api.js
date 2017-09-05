var Q = require('q');
var request = require('request');
var qRequest = Q.denodeify(request);

var link = require('./helpers/link');

module.exports = {
  search: search,
  download: download
};

function search(query) {
  var url = link.apiSearch(query);
  return qRequest(url)
    .then(function(res) {
      var data = res[1]; // res[0] is the header
      return JSON.parse(data).results;
    })
    .catch(function(err) {
      colog.error("Could not connect to the CDNJS API");
      throw new Error("Connection error");
    });
}

function download(name, version, file) {
  var url = link.toFile(name, version, file);
  return request.get(url);
}
