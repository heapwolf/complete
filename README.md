# Custom commandline tab completion for node.js applications.

## Using this module.

### Get the module from [NPM][0].

```
  $npm install complete
```

### Require the module.

```javascript
  var complete = require('complete');
```

### Install your program.

Your installment procedure should place your CLI program in a location made accessible by the PATH variable. 

On POSIX and Unix-like operating systems, the $PATH variable is specified as a list of one or more directory names separated by colon (:) characters.

The /bin, /usr/bin, and /usr/local/bin directories are typically included in most users' path setting (although this varies from system to system). When a command name is specified by the user or an exec call is made from a program, the system searches the path, examining each directory from left to right in the list, looking for a filename that matches the command name. Once found, the program is executed as a child process of the command shell or program that issued the command.

```
  /usr/local/bin/myprogram
```

## API

- After you put it in an accessible place, run it with the `--install` option. This will install a series of bash scripts in the `/usr/local/lib/node_scripts/` directory. Optionally, you can then add a script to your CLI program to ensure that it has been `installed`.

```javascript
  complete.installed(function(state) {
    if(state === false) {
      console.log('You have not installed this program. please run `' + complete.name + ' --install`.');
    }
  });
```

### Create a list of commands that you want to autocomplete with.

```javascript
  complete.list = ['apple', 'orange', 'pear', 'lemon', 'mango'];
```

### Optionally you can define a callback that will get called when the match when the completion happens.

```javascript
  complete.callback = function(userInput, reducedList) {
    // do something if this is an orange.
  };
```

### initialize the auto completion method.

```javascript
  complete.init();
```

## Stability
Is this module stable and ready to work on every system? No. This module is in the extremely early prototyping phase. version 1.0 will be a major milestone of stability.

## Licence

(The MIT License)

Copyright (c) 2010 hij1nx <http://www.twitter.com/hij1nx>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[0]:http://npmjs.org/
