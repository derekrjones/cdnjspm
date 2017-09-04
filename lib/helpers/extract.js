var colog = require('colog');
var semver = require('semver');

module.exports = {
  asset: asset,
  matchingVersion: matchingVersion
};

/*
 * returns an asset object containing the assets version, and an array
 * of file objects each having a name property
 */
function asset(lib, version) {
  files = [];
  for (var i in lib.assets) {
    var asset = lib.assets[i];
    var doesSatisify = semver.valid(asset.version)
      && semver.satisfies(asset.version, version)
      || version == asset.version;
    if (doesSatisify) {
      return asset;
    }
  }
  // Version not found
  var versions = lib.assets.map(function(a) { return a.version});
  colog.warning("Could not find " + lib.name + " version " + version);
  console.log(". Maybe you wanted one of " + versions.toString());
  throw new Error("Version not found");
}

/*
 * Iterates through the lib's assets to return a string representing
 * an asset version matching the semver version passed in. It throws
 * an error if none found
 */
function matchingVersion(lib, version) {
  return asset(lib, version).version;
}
