
var fs = require('fs'),
    util = require('util'),
    exec = require('child_process').exec,
    os = require('os'),
    which = require('which')

    home = process.env.HOME,
    folder = home + '/.node-complete/',

complete = {};

module.exports = complete;

//
// an array of possible matches.
//
complete.list = [];

//
// initalize the autocomplete module.
//
complete.init = function() {

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
// get the name of the program.
//
function getProgramName() {

  var args = process.argv.slice(0);

  if (args[0] === 'node' || args[1] === 'sudo') { 
    args.shift(); 
  }

  if (args[0] === 'node') { 
    argv.shift(); 
  }

  var fullname = args[0].split('/');

  return name = fullname[fullname.length-1];
}

//
// check for the node_scripts folder
//
fs.stat(folder, function(err, s) { 

  if (err && err.errno == 34) {

    //
    // if the directory does not exist, make it.
    //
    if(err) { 
      fs.mkdirSync(folder, 0755);
    }

    //
    // Add the sourcing to the bashrc file.
    //
    var loginscript = home + ((os.type() === 'Darwin') ? '/.bash_profile' : '/.bashrc');

    fs.stat(loginscript, function(err, s) {
      
      if (!err) {

        isCompletionSourced(loginscript, function(result, data) {

          if (result) {
            sourceCompletion(loginscript, data);
          }
        });

      }
    });

  }
  else {

    registerListener(getProgramName());
  }
});

//
// register a completion listener for a program.
//
function registerListener(name) {

  var script = folder + '/' + name + '.sh';

  fs.stat(script, function(err, s) {

    if (err && err.errno === 34) {

      var listener = [

        //
        // here is the actual listener script.
        //
        '_compListener() {',
        '  local curw',
        '  COMPREPLY=()',

        '  curw=${COMP_WORDS[COMP_CWORD]}',
        '  COMPREPLY=($(exampleapp --compgen "${COMP_WORDS[@]}"))',
        '  return 0',
        '}',

        //
        // register the listener with the program name.
        //
        'complete -F _compListener ' + name

      ].join('\n');

      fs.writeFile(script, listener, function(err) {

        if (err) {
          throw err;
        }

        console.log('info: successfully installed auto-complete for `' + name + '`. shell restart required.');
      });
    }
  });
}

//
// isCompletionSourced()
// determines if the completion program has been sourced to the user login script.
//
function isCompletionSourced(script, callback) {

  fs.readFile(script, function(err, data) {

    data = data.toString();
    var identifier = data.indexOf('#NODE-COMPLETE:');

    if(identifier === -1) {
      callback(true, data);
    }
    else {
      callback(false);
    }
  });
}

function sourceCompletion(script, data) {

  var sourceauto = [

    '',
    '#NODE-COMPLETE: Custom tab completion listeners for node.js programs.',
    '',
    'shopt -s progcomp',
    '',
    'for f in ~/.node-complete/.*; do',
    '  if [ -f $f ]; then',
    '    source $f',
    '  fi;',
    'done',
    ''

  ].join('\n');

  fs.writeFile(script, data + sourceauto, function(err) {

    if (err) {
      throw err;
    }

    console.log('info: node-complete has been installed. shell restart required.');
  });
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
