/**
 * Bash Completion
 */

var fs = require('fs')
  , path = require('path')
  , join = path.join;

var home = process.env.HOME
  , bashrc = join(home, '.bashrc')
  , dir = join(home, '.node-completion');

var commands
  , program
  , completion
  , opt;

/**
 * Bash Completion Function
 */

function complete(options) {
  if (process.platform === 'win32') return;

  options = options || {};
  commands = options.commands || exports.commands;
  opt = options.options || exports.options;
  program = options.program || exports.program;
  completion = options.completion || exports.completion;

  if (completion) {
    if (!program) throw new Error('Program name required.');
    return complete.setup({
      program: program,
      completion: completion
    });
  } else {
    // Assume we're inside the main script
    if (!program) program = getName();
  }

  var argv = process.argv
    , index = argv.indexOf('--compgen')
    , words;

  ensureCompletion(program);

  if (~index) {
    exports.matching = true;

    // Cannot allow any output:
    process.on('uncaughtException', function() {
      ;
    });

    words = argv.slice(index + 1);
    completeWords(words);

    // Explanation:
    // If something asynchronous is happening, and the user
    // has opted to go the single-file route,
    // we need to stop the module from doing anything further.
    // This gets caught by the uncaughtException listener
    // and stops anymore synchronous code from being executed.
    // Yes, it is hacky.
    throw 'stop';
  }
}

function resolveMain(file) {
  var dir = path.dirname(require.main.filename);
  return path.resolve(dir, file);
}

complete.setup = function(options) {
  var program = options.program
    , file = options.completion;

  if (file[0] !== '/') file = resolveMain(file);
  ensureCompletion(program, file);
};

function completeWords(words) {
  var cur = words[words.length-1]
    , prev = words[words.length-2]
    , com = commands
    , command = com
    , i = 1
    , out;

  // Reduce
  while (com = com[words[i++]]) {
    command = com;
  }

  if (typeof command === 'function') {
    // A dynamic match.
    command(words, prev, cur);
  } else if (typeof command === 'object') {
    // Already matched
    if (i === words.length + 1) {
      echo(cur);
      return;
    }

    // A static/dynamic match.
    if (command.__exec__) {
      command.__exec__(words, prev, cur);
    }

    // A static match.
    out = match(cur, command);
    if (out) {
      echo(out);
      return;
    }

    // Resolve position-independent options.
    // Possibly add dynamic behavior here.
    out = match(cur, opt);
    if (out) {
      echo(out);
      return;
    }
  } else {
    process.exit(1);
  }
}

function ensureCompletion(program, completion) {
  if (!exists(dir)) fs.mkdirSync(dir, 0755);
  if (!exists(bashrc)) fs.writeFileSync(bashrc, '\n');

  var data = fs.readFileSync(bashrc, 'utf8');
  if (!~data.indexOf('# Node Completion')) {
    data += source;
    fs.writeFileSync(bashrc, data);
  }

  var file = join(dir, program);
  if (exists(file)) return;

  var data = comp
    .replace(/{{NAME}}/g, program)
    .replace(/{{FILE}}/g, completion || program);

  fs.writeFileSync(file, data);
}

function getName() {
  var argv = process.argv.slice();
  if (argv[0].slice(-4) === 'node') argv.shift();
  var file = argv[0];
  while (fs.lstatSync(file).isSymbolicLink()) {
    file = fs.readlinkSync(file);
  }
  return path.basename(file);
}

/**
 * Bash
 */

var source = [
  '',
  '# {{{',
  '# Node Completion - Auto-generated, do not touch.',
  'shopt -s progcomp',
  'for f in "$(command ls ~/.node-completion)"; do',
  '  f="$HOME/.node-completion/$f"',
  '  test -f "$f" && . "$f"',
  'done',
  '# }}}',
  ''
].join('\n');

var comp = [
  '__{{NAME}}_comp() {',
  '  COMPREPLY=()',
  '  local path=$(which {{FILE}} 2>/dev/null || echo {{FILE}})',
  '  COMPREPLY=($(node "$path" --compgen "${COMP_WORDS[@]}"))',
  '  return 0',
  '}',
  '',
  'complete -F __{{NAME}}_comp {{NAME}} 2>/dev/null',
  ''
].join('\n');

/**
 * Helpers
 */

function match(key, list) {
  if (!list) return;
  if (!Array.isArray(list)) list = Object.keys(list);

  var out = []
    , l = list.length
    , i = 0;

  for (; i < l; i++) {
    if (list[i] === '__exec__') continue;
    if (list[i].indexOf(key) === 0) out.push(list[i]);
  }

  return out.join(' ');
}

function exists(file) {
  try {
    fs.statSync(file);
    return true;
  } catch(e) {
    return false;
  }
}

function echo(text) {
  if (!text) return;
  process.stdout.write(text + '\n');
}

/**
 * Complete Code - Callback-style
 */

//
// an array of possible matches.
//

complete.list = [];

//
// initalize the autocomplete module.
//

complete.init = function() {
  ensureCompletion(getName());

  var argc = process.argv.indexOf('--compgen');

  if (~argc) {

    compgen(process.argv, argc, complete.callback);
  }
  return this;
};

complete.add = function(opts) {

  var out = '';

  if (typeof opts === 'string') {
    out = ' ' + opts + ' ';
  }
  else if (Array.isArray(opts)) {

    opts.forEach(function(opt) {
      out += ' ' + opts + ' ';
    });
  }

  process.stdout.write(out);
}

//
// compgen({string-data})
// compgen is somewhat of the program entry point when actively used by
// a completion listener. it will accept a list of arguments and return
// a list of potential matches for the last partial argument provided.
//

function compgen(argl, i, callback) {
  var arglist = argl[argl.length-1];
  var reducedlist = [];

  if (complete.list.length > 0) {
    complete.list.forEach(function(item) {
      if(~item.indexOf(arglist)) {
        reducedlist.push(item);
      }
    });
  }
  process.stdout.write(reducedlist.join('\n'));

  if(complete.callback) {
    var lastSelection = argl[argl.length-2];
    complete.callback(lastSelection, arglist, reducedlist);
  }
  process.exit(0);
}

complete.callback = function(last, args, list) {
};

/**
 * Expose
 */

exports = complete;

exports.output = function(key, list) {
  echo(match(key, list));
};

exports.match = match;
exports.echo = echo;

module.exports = complete;
