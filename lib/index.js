
var argv = require('optimist').argv,
    colors = require('colors'),
    fs = require('fs'),
    util = require('util'),
    exec = require('child_process').exec,
    child;

var folder = '/usr/local/lib/node_scripts/';
var file = '/usr/local/lib/node_scripts/autocomp.sh';

var complete = {};
module.exports = complete;

// get the name of the program.
var args = process.argv.slice(0);

if (args[0] === 'node' || args[1] === 'sudo') { args.shift(); }
if (args[0] === 'node') { argv.shift(); }

var fullname = args[0].split('/');
var name = fullname[fullname.length-1];

//
// name
// the name of the current program being executed by node.
//
complete.name = name;

//
// usage
// in some cases this module will be acessed by other apis, this
// provides command line usage information.
//
complete.usage = [

  'usage:                                                      '.underline,
  '  ' + name + ' [options]                                    ',
  '                                                            ',
  'options:                                                    '.underline,
  '  -c  --compgen [argv]   Generate a comp                    ',
  '  -i  --install          Install the listener script        ',
  '  -u  --uninstall        Remove the installer script        '

].join('\n');

//
// list
// a list of values that will be used to create a subset of matches for
// the current comparison.
//
complete.list = [];

//
// installed(callback)
// checks the environment to find out if the completion listener has been
// installed. it retuns a callback which yields the result of the check.
//
complete.installed = function installed(callback) {
  if(argv.install) {
    return callback(true);
  }
  child = exec('echo $COMP_' + name.toUpperCase(), 
    function (err, stdout, stderr) {
      return callback(!!+stdout);
    }
  );
};

//
// installer
// This is a bash script that may get appended to the .autocomps file in the
// node_scripts folder.
//
var listener = [

  '\n#COMPLETE_' + name.toUpperCase(),
  '_compListener() {',
  '  local curw',
  '  COMPREPLY=()',

  '  curw=${COMP_WORDS[COMP_CWORD]}',
  '  COMPREPLY=($(' + name + ' -c "${COMP_WORDS[@]}"))',
  '  return 0',
  '}',
  'complete -F _compListener ' + name,
  'export COMPLETE_' + name.toUpperCase() + '=1',
  '#END'

].join('\n');

if (argv.install || argv.uninstall) {

  // if(process.argv[0] !== 'sudo') {
  //   return process.stdout.write('error: `' + name + 
  //     '` must be started with sudo for install to work.\r\n');
  // }

  //
  // check for the node_scripts folder
  //
  fs.stat(folder, function(err, s) { 

    //
    // if the directory does not exist, make it.
    // perhaps we should also check errno.
    //
    if(err) { 
      fs.mkdirSync(folder, 0755);
    }

    //
    // if the file does not exist, make it.
    // perhaps we should also check errno.
    //
    fs.stat(file, function(err, s) {

      if (err) { // we dont have the file.
        fs.writeFile(file, listener, function(err) {
          if (err) { 
            throw err; 
          }
        });
      }
      else {
        fs.readFile(file, function(err, data) {
          if (err) { 
            throw err; 
          }

          data = data.toString();

          var identifier = data.indexOf('#COMPLETE_' + name.toUpperCase());
          var segment;

          // if the listener script exists, extract it.
          if (argv.uninstall && identifier !== -1) {
            segment = data.substr(identifier, data.length);
            data = segment.substr(0, segment.indexOf('#END'));
          }
          else if (identifier === -1){ // this is a new script, append it.
            data += listener;
          }

          fs.writeFile(file, data, function(err) {
            if (err) {
              throw err;
            }
            return process.stdout.write('Successfully installed. restart teminal session to use.');
          });
        }); // fs.readFile
      } // already have the file

    }); // fs.stat(file)
  }); // fs.stat(dir)
}

//
// compgen({string-data})
// compgen is somewhat of the program entry point when actively used by
// a completion listener. it will accept a list of arguments and return
// a list of potential matches for the last partial argument provided.
//
if (argv.c || argv.compgen) {
  compgen(argv.c || argv.compgen, callback);
}

function compgen(argl, callback) {

  var reducedlist = [];

  if (complete.list.length > 0) {
    //
    // TODO: where the list of partials gets created.
    //
  }

  return exports.callback(argl, reducedlist);
}