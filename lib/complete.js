/**
 * Completed
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

function completed(options) {
  if (process.platform === 'win32') return;

  options = options || {};
  commands = options.commands || exports.commands;
  opt = options.options || exports.options;
  program = options.program || exports.program;
  completion = options.completion || exports.completion;

  if (completion) {
    if (!program) throw new Error('Program name required.');
    return completed.setup({
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
    complete(words);

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

completed.setup = function(options) {
  var program = options.program
    , file = options.completion;

  if (file[0] !== '/') file = resolveMain(file);
  ensureCompletion(program, file);
};

function complete(words) {
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
 * Expose
 */

exports = completed;

exports.output = function(key, list) {
  echo(match(key, list));
};

exports.match = match;
exports.echo = echo;

module.exports = completed;
