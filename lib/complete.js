// 
// complete
// Bash Completion for node.js
// 

var fs = require('fs');
var path = require('path');

var dir = path.join(process.env.HOME, '.node-completion');
var hop = Object.prototype.hasOwnProperty;
var bashrc = getRc();
var argv = require('optimist').argv;

var commands;
var program;
var opt;
var words = [];
// 
// Completion
// 
function complete(options) {

  options = options || {};
  commands = options.commands || exports.commands || {};
  opt = options.options || exports.options;
  program = options.program || exports.program;

  // Ensure scripts
  ensure(program || getName());

  var argv = process.argv;
  var index = argv.indexOf('--compgen');

  if (~index) {
    // Cannot allow any output:
    process.on('uncaughtException', function() {
      ;
    });

    words = argv.slice(index + 1);
    completeWords();

    // Explanation:
    // If something asynchronous is happening in a matching
    // function, we need to stop the module from doing anything
    // further. This gets caught by the uncaughtException listener
    // and stops anymore synchronous code from being executed.
    // Yes, it is hacky.
    throw 'stop';
  }
}

function completeWords() {

  var cur = words[words.length-1];
  var prev = words[words.length-2];
  var command = commands;
  var l = words.length;
  var i = 1;
  var word;
  var out;

  // Reduce
  for (; i < l; i++) {
    word = words[i];
    if (Array.isArray(command)) {
      if (~command.indexOf(word)) {
        command = true;
      }
      break;
    } else {
      if (command[word] && hop.call(command, word)) {
        command = command[word];
      } else {
        break;
      }
    }
  }

  if (typeof command === 'function') {
    // A dynamic match.
    return command.length > 2
      ? command(words, prev, cur, output)
      : command(words, output);
  } else if (command) {
    // Already matched
    if (i === l) {
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

// 
// Ensure Completion Script and Startup Code
//
function ensure(program) {

  // These don't need to be done in serial,
  // so we can make this function more
  // efficient by going async.
  
  ensure.script(program);
  ensure.rc();
}

ensure.rc = function() {

  var data = '', err;

  if (argv.install) {
    process.stdout.write(source);
    process.exit(0);
  }
  
  try {
    data = String(fs.readFileSync(bashrc));
  }
  catch(ex) {
    err = ex;
  }

  if ((err && err.code === 'ENOENT') || !~data.indexOf('# NODE-COMPLETE')) {
    data += source;

    if (!complete.installMessage) {
      var name = getName();
      process.stdout.write([
        '',
        'ATTENTION: Your environment doesn\'t support auto-complete.',
        'To enable it, try running the following commands:',
        '  node ' + name + ' --install >> ' + bashrc,
        '  source ' + process.env['HOME'] + '/.node-completion/' + name,
        ''
      ].join('\r\n'));
    }
    else {
      process.stdout.write(complete.installMessage);
    }
    process.exit(0);
  }
  

};

ensure.script = function(program) {

  var file = path.join(dir, program);
  var data = completion;

  data = data.replace(/{{NAME}}/g, program);

  fs.stat(dir, function(err) {

    fs.mkdir(dir, 0755, function() {
      fs.stat(file, function(err) {
        if (err && err.code === 'ENOENT') {
          fs.writeFile(file, data);
        }
      });
    });
  });
};

// 
// Get RC Filename
//
function getRc() {
  if (process.platform !== 'darwin') {
    return path.join(process.env.HOME, '.bashrc');
  }

  var files = ['.bash_profile', '.bash_login', '.profile'];
  var l = files.length;
  var i = 0;
  var file;

  for (; i < l; i++) {
    try {
      file = path.join(process.env.HOME, files[i]);
      fs.statSync(file);
      return file;
    } catch (e) {
      ;
    }
  }

  // If none exist, create a .bash_profile.
  return path.join(process.env.HOME, '.bash_profile');
}

// 
// Get Script Name
//
function getName() {
  var argv = process.argv.slice();
  var file;
  var cd;

  if (argv[0].slice(-4) === 'node') argv.shift();

  file = argv[0];
  cd = path.dirname(file);

  try {
    while (fs.lstatSync(file).isSymbolicLink()) {
      file = fs.readlinkSync(file);
      cd = path.resolve(cd, path.dirname(file));
      file = path.resolve(cd, path.basename(file));
    }
  } catch (e) {
    file = argv[0];
  }

  return path.basename(file);
}

// 
// Bash
//
var source = [

  '#',
  '# NODE-COMPLETE',
  '# Custom command line tab completion for Node.js',
  '#',
  'shopt -s progcomp',
  'for f in $(command ls ~/.node-completion); do',
  '  f="$HOME/.node-completion/$f"',
  '  test -f "$f" && . "$f"',
  'done',
  ''
].join('\n');

var completion = [

  '__{{NAME}}_comp() {',
  '  COMPREPLY=()',
  '  COMPREPLY=($({{NAME}} --compgen "${COMP_WORDS[@]}"))',
  '  return 0',
  '}',
  '',
  'complete -F __{{NAME}}_comp {{NAME}} 2>/dev/null',
  ''
].join('\n');

// 
// Helpers
//
function match(key, list) {
  if (!list) return;

  var type = typeof list;
  if (type === 'string') {
    list = [list];
  } else if (type === 'object' && !Array.isArray(list)) {
    list = Object.keys(list);
  } else {
    return '';
  }

  var out = [];
  var l = list.length;
  var i = 0;

  for (; i < l; i++) {
    if (list[i] === '__exec__') continue;
    if (list[i].indexOf(key) === 0) out.push(list[i]);
  }

  return out.join(' ');
}

function echo(text) {
  if (!text) return;
  process.stdout.write(text + '\n');
}

function output(key, list) {
  if (!list) {
    list = key;
    key = words[words.length-1];
  }
  return echo(match(key, list));
}

// 
// Callback Style
// Expose a lower level
// method of doing things.
// 

// 
// list
// An array of possible matches.
// 
complete.list = [];

// 
// init
// Initalize the autocomplete module.
//
complete.init = function() {
  ensure(getName());

  var argc = process.argv.indexOf('--compgen');

  if (~argc) {
    process.on('uncaughtException', function() {
      ;
    });

    compgen(process.argv, argc, complete.callback);

    // If there are still any callbacks on the event loop,
    // we need to kill the current stack immediately.
    throw 'stop';
  }

  return this;
};

// 
// add
// Echo an array or string.
//
complete.add = function(opt) {
  if (Array.isArray(opt)) {
    opt = opt.join(' ');
  }
  // The line feed `echo` adds acts as a
  // delimiter, so we can always add matches.
  echo(opt + '');
};

// 
// callback
// The user's callback
// 
complete.callback = function(last, args, list) {
  ;
};

//
// installMessage
//
complete.installMessage = null;

// 
// compgen
// compgen is somewhat of the program entry point when actively used by
// a completion listener. it will accept a list of arguments and return
// a list of potential matches for the last partial argument provided.
//
function compgen(argl, i, callback) {
  var arglist = argl[argl.length-1];
  var reducedlist = [];
  var lastSelection;

  if (complete.list.length > 0) {
    complete.list.forEach(function(item) {
      if (~item.indexOf(arglist)) {
        reducedlist.push(item);
      }
    });
  }

  echo(reducedlist.join('\n'));

  if (complete.callback) {
    lastSelection = argl[argl.length-2];
    complete.callback(lastSelection, arglist, reducedlist);
  }
}

// 
// Expose
//
exports = process.platform === 'win32'
  ? function() {}
  : complete;

exports.match = match;
exports.echo = echo;
exports.output = output;

module.exports = exports;
