# Synopsis
Custom command line tab completion for node.js applications.

# Example

```javascript
#!/usr/bin/env node

var complete = require('complete'); // get the `complete` module.

//
// list of items to complete on.
//
complete.list = ['apple', 'orange', 'pear', 'lemon', 'mango'];

complete.callback = function(lastSelection, userInput, reducedList) {

  if (lastSelection === 'apple') {
	complete.add('sauce');
  }
};

complete.init();

//
// continue with the application...
//
console.log('program started with the following arguments:', process.argv[2] || 'none provided');
```

# Distribution and Installation

Your installment procedure should place your CLI program in a location made accessible by the `PATH` variable. If users install your program with the NPM `-g` option, your program will be in the path.

``` bash
/usr/local/bin/myprogram -> /usr/local/lib/node_modules/myprogram/bin/myprogram
```

# API

## list
Create a list of commands that you want to autocomplete with.

```javascript
complete.list = ['apple', 'orange', 'pear', 'lemon', 'mango'];
```

## callback
Optionally you can define a callback that will get called when the match when the completion happens.

```javascript
complete.callback = function(lastSelection, userInput, reducedList) {

  //
  // do something if this is an `orange`. Note that anything that
  // you `process.stdout.write()` will be added to the auto complete
  // list.
  //
};
```

## init()
Initialize the auto completion behavior.

```javascript
complete.init();
```


## Higher Level Example

``` js
var complete = require('complete');

complete({
  program: 'my-program',
  // Commands
  commands: {
    'hello': function(words, prev, cur) {
      complete.output(cur, ['abc', 'def']);
    },
    'world': {
      'hi': function(words, prev, cur) {
        complete.echo('next');
      }
    }
  },
  // Position-independent options.
  // These will attempted to be
  // matched if `commands` fails
  // to match.
  options: {
    '--help': {},
    '-h': {},
    '--version': {},
    '-v': {}
  }
});
```

## The above results in

``` bash
$ my-program he<TAB>
$ my-program hello
$ my-program hello a<TAB>
$ my-program hello abc
```

## A word about speed optimization

For the completion to work it needs to load the Node.js environment (~100msec),
execute your custom CLI app logic (>300msec for relative complex apps) and the
specific `complete` logic, so, for large apps can be a little slow to complete
the commands if all your app code needs to be executed, so it is a good idea to
execute the `complete` logic very soon as the app starts and then terminate the
app. This will result in a speed gain that will be noticeable by users.

You can use the following code snippet as a template to it:

```js
#!/usr/bin/env node
/*
 * Checks the command line arguments for presence of `compgen` (completion generation)
 * argument, which is the way `complete` module generates command completion to
 * be seed to bash.
 *
 * If this option is found, then the CLI app will terminate successfully since
 * no further actions will needed (it was executed only to gather completion info).
 *
 * This is an optimization to gain in speed for both completion and command execution
 * workflows.
 *
 */
if (process.argv.indexOf('--compgen') != -1) {
  // Load command completions.
  require('./../lib/completion');

  // Terminate the app successfully.
  process.exit(0);
}

// Rest of your CLI app.
```

# License

(The MIT License)

Copyright (c) 2010 hij1nx <http://www.twitter.com/hij1nx>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

