#!/usr/bin/env node

var colog = require('colog');
var Q = require('q');
var argv = require('yargs').argv;

var store = require('./lib/store');
var dl = require('./lib/downloader');
var prompt = require('./lib/prompt');
var extract = require('./lib/helpers/extract');
var link = require('./lib/helpers/link');

module.exports = {
  run: run,
  parseArgs: parseArgs,
  parseMatches: parseMatches
};

if (require.main === module) {
  run(argv);
}

function showHelp() {
  console.log("Usage: cdnjspm <packageName> [options]");
  console.log();
  console.log("Options:");
  console.log();
  console.log("-o, --options\tSpecify the ouput directory.");
  console.log("-v, --version\tSpecify a version (semver support)");
  console.log("-h, --help\tShow help page");
  console.log("-s, --silent\tDiscrete output. Will only show prompts.");
  console.log("-m, --minimal\tDownload only the main file (e.g.: jquery.min.js)");
  console.log("-t, --tag\tPrints out html script/link tags instead of downloading");
  console.log();
  console.log("Example usage:");
  console.log();
  console.log("cdnjspm jquery\t\t\t# Downloads latest version of jQuery");
  console.log("cdnjspm jquery -o lib/deps\t# Downloads latest version of jQuery to the lib/deps/ directory");
  console.log("cdnjspm jquery -v \"<2\"\t\t# Downloads a version of jQuery that's lower than 2.0.0");
  console.log("cdnjspm jquery -mt \"1.x\"\t\t# Prints out a jQuery.min.js script tag for the latest version of jQuery 1");
}

function run(argv) {
  var opts = parseArgs(argv);
  if (opts.showHelp || !opts.query) {
    showHelp();
    return;
  }
  if (opts.silent) {
    colog.silent(true);
  }

  // The main call to the store
  return store.findMatching(opts.query)
    .then(function(matches) {
      return parseMatches(matches, opts);
    })
    .catch(console.error);
}

function parseArgs(argv) {
  return {
    query: argv._[0],
    showHelp: argv.h || argv.help || false,
    destination: argv.o || argv.output || "",
    version: argv.v || argv.version,
    silent: argv.s || argv.silent || false,
    minimal: argv.m || argv.minimal || false,
    printHTML: argv.t || argv.tag || false
  }
}

function parseMatches(matches, opts) {
  if (matches.length == 0) {
    console.log("No matches found for " + opts.query);
  } else if (matches.length > 1) {
    colog.warning("Found many packages! Which one do you want?");
    var itemNames = matches.map(function(item) { return item.name });
    return prompt.options(itemNames)
      .then(function(ans) {
        return processRequest(matches[ans], opts);
      })
      .catch(console.error);
  } else {
    processRequest(matches[0], opts);
  }
}

function processRequest(lib, opts) {
  return opts.printHTML ? printTags(lib, opts) : install(lib, opts);
}

function printTags(lib, opts) {
  var semVersion = opts.version || lib.version;
  if (opts.minimal) {
    var fileName = lib.latest.split('/').slice(-1)[0];
    var version = extract.matchingVersion(lib, semVersion);
    var tag = link.HTML(lib.name, version, fileName);
    if (tag) console.log(tag);
  } else {
    var asset = extract.asset(lib, semVersion);
    for (var i in asset.files) {
      var tag = link.HTML(lib.name, asset.version, asset.files[i]);
      if (tag) console.log(tag);
    }
  }
}

function install(lib, opts) {
  colog.info("Will install " + lib.name);
  return store.getDependentPackages(lib)
    .then(function(dependentPackages) {
      var main = dl.download(lib, opts.version, opts.destination, opts.minimal);
      var dependents = dependentPackages.map(function(dependency) {
        dl.download(dependency, dependency.depVersion, opts.destination, opts.minimal);
      });
      return Q.all([main].concat(dependents));
    })
    .catch(console.error);
}

