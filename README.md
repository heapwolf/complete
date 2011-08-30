# Custom commandline tab completion for node.js applications.

## Using this module.

- Get the module from NPM.

```
  $npm install complete
```

- Require the module.

```javascript
  var complete = require('complete');
```

- Put your CLI program in a location that is also in the PATH (below is an example).

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

- Create a list of commands that you want to autocomplete with.

```javascript
  complete.list = ['apple', 'orange', 'pear', 'lemon', 'mango'];
```

- Optionally you can define a callback that will get called when the match when the completion happens.

```javascript
  complete.callback = function(userInput, reducedList) {
    // do something if this is an orange.
  };
```

- initialize the auto completion method.

```javascript
  complete.init();
```

