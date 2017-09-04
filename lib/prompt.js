var Q = require('q');
var readline = require('readline');

module.exports = {
  YN: yepNope,
  options: selectOption
};

// Queries a question. Returns a boolean based on the answer,
// redisplays a prompt if user input is invalid
function yepNope(question) {
  console.log(question + '(Y/n)');
  return promptUntilMatch(/(y|n)/i)
    .then(function(res) {
      return /y/i.test(res);
    })
}

// Queries user to pick from a bunch of options
function selectOption(options) {
  for (var i in options) {
    console.log(i + ' - ' + options[i]);
  }
  return promptUntilMatch(/[0-9]+/)
    .then(function(res) {
      return parseInt(res);
    });
}

/*
 * Displays a prompt, and redisplays a prompt until response matches
 * the format. This returns a promise that resolves to that answer
 */
function promptUntilMatch(regex) {
  return loop('');

  function loop(answer) {
    if (regex.test(answer)) {
      return answer;
    } else {
      return prompt().then(loop);
    }
  }
}

/*
 * Displays a prompt and returns a promise that will resolve to
 * the user input
 */
function prompt() {
  var deferred = Q.defer();
  var rl = readline.createInterface(process.stdin, process.stdout);

  rl.prompt();
  rl.on('line', function(line) {
    rl.close();
    deferred.resolve(line);
  });
  return deferred.promise;
}
