var fs = require('fs');
var colog = require('colog');
var Q = require('q');
var rl = require('readline');
var request = Q.denodeify(require('request'));
var prompt = require('./prompt');
var link = require('./helpers/link');

var store = {
  _call: request,
  findCollection: findCollection,
  findMatching: findMatching,
  getDependentPackages: getDependentPackages
};

module.exports = store;

/*
 * This method calls the cdnjs api with a search request
 */
function findCollection(query) {
  var url = link.apiSearch(query);
  return store._call(url).then(function(res) {
    var data = res[1]; // res[0] is the header
    return JSON.parse(data).results;
  }).catch(function(err) {
    colog.error("Could not connect to the CDNJS API");
    throw new Error("Connection error");
  });
}

/*
 * This method tries to find a library whose name matces the string
 * to the letter. Always returns an array of packages, empty if none,
 * with single entry if one found, with multiple if conflict.
 */
function findMatching(query) {
  return findCollection(query)
    .then(function(matches) {
      for (var i in matches) {
        if (matches[i].name == query) {
          return [matches[i]];
        }
      }
      return matches;
    });
}

/*
 * This function finds all dependent packages of the given
 * This function is crazy complex because of the promise system
 * and many possible outcomes. If anyone reads this and thinks:
 * "Huh, that can be done better", please let me know!
 */
function getDependentPackages(lib) {
  if (!lib.dependencies) return Q([]);
  var depNames = Object.keys(lib.dependencies);
  colog.warning("This library has dependencies.");
  console.log("=>\t" + depNames.toString());

  return prompt.YN("Would you like to install them?")
    .then(function(choice) {
      if (!choice) return [];
      var dependentPackages = [];
      // Loop over all elements in deps, chaining promises
      // to eachother. CRAZY shizzle :)
      return depNames.reduce(function(previousPromise, depName) {
        return previousPromise.then(function() {
          return findMatching(depName).then(function(matches) {
            if (matches.length == 1) {
              matches[0].depVersion = lib.dependencies[depName];
              dependentPackages.push(matches[0]);
            }
            else {
              var conflictNames = matches.map(function(i) { return i.name });
              colog.warning("Found conflicting packages for " + depName);
              return prompt.options(conflictNames).then(function(ans) {
                matches[ans].depVersion = lib.dependencies[depName];
                dependentPackages.push(matches[ans]);
              });
            }
          });
        });
      }, Q())
        .then(function() {
          return dependentPackages;
        });
    });
}
