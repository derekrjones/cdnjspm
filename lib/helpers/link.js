var URL_API = 'http://api.cdnjs.com/libraries?search={{name}}&fields=version,description,assets,dependencies';
var URL_SOURCE = '//cdnjs.cloudflare.com/ajax/libs/{{name}}/{{version}}/{{filename}}';

var HTML_LINK = '<link rel="stylesheet" href="{{url}}">';
var HTML_SCRIPT = '<script type="text/javascript" src="{{url}}"></script>';

module.exports = {
  HTML: HTML,
  toFile: toFile,
  apiSearch: apiSearch
};

function HTML(pkgName, version, filename) {
  var tag;
  if (/.css$/.test(filename)) {
    tag = HTML_LINK;
  } else if (/.js$/.test(filename)) {
    tag = HTML_SCRIPT;
  } else {
    return;
  }
  return tag.replace('{{url}}', getSourceURL(pkgName, version, filename));
}

function toFile(pkgName, version, filename) {
  return 'http:' + getSourceURL(pkgName, version, filename);
}

function apiSearch(name) {
  return URL_API.replace('{{name}}', name);
}

function getSourceURL(pkgName, version, filename) {
  return URL_SOURCE
    .replace('{{name}}', pkgName)
    .replace('{{version}}', version)
    .replace('{{filename}}', filename);
}
