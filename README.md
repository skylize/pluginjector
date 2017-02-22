# pluginjector

Simple no nonsense dependency injection for extensibility and testability

----
Install from [NPM](https://https://www.npmjs.com/package/pluginjector)

Help with development [on GitHub](https://github.com/skylize/pluginjector)

----

Donations accepted. 😃 😃 😃  $5 [![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_paynow_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PH6DA9E2KNN94) $5 😘 😘 😘

### - Usage -

Note: Uses ES6/ES2015 features and may fail on Node versions prior to v6.

##### Pass your core module object to pluginjector then inject plugins
```javascript

const pluginjector = require('pluginjector')

const inject = pluginjector(myModule)

const myNewModule = inject(myPlugin)

```
##### Overwrite properties in your module

```javascript

const myModule = { val: 1 }
const myPlugin = { val: 2 }

const newModule = pluginjector(MyModule)(myPlugin)

assert(newModule.val === 2) // true

```

##### Overwrite methods in your module

```javascript
const myModule = {
  method (){return 'method'}
}

const myPlugin = {
  method (){return ('plugin')}
}

const newModule = pluginjector(MyModule)(myPlugin)

assert(newModule.method() === 'plugin') // true

```


##### Namespace your plugins
```javascript

const myPlugin {
  method( return 'method' )
}

const myNewModule = inject({pluginname: myPlugin})

assert(myNewModule.myPlugin.method() === 'method') // true

```

##### Bind `this` to your methods with a simple flag
more detailed look at this [later](#this)
```javascript

const myModule = {val: 1}

const myPlugin = {
  pluginjectorBindThis: true,
  method (){ return this.val }
}

const newModule = pluginjector(myModule)({myPlugin})

assert(newModule.myPlugin.method() === 1) // true

```

##### Pass in files to be imported
```javascript

const newModule = inject('../path/to/my/file')

const newNamespacedModule = inject({pluginName: '../path/to/my/file'})

```

##### Include a default directory and your users can pass in just the plugin name.
```javascript

const inject = (myModule, {dir: '../path/to/default/directory'})

const newModule = inject('pluginName')

const newNamespacedModule = inject({differentPluginName: 'pluginName'})

```

##### Original core is shallow copied to minimize possibility of undesired mutations

```javascript

let inject = plugininjector({data: 'original module'})
const newModule = inject({data: 'new module'})

inject = pluginjector(myModule)
const anotherNewModule = inject({})

assert(newModule.data === 'new module') // true
assert(anotherNewModule.data === 'original module') // true

```

##### Lazily inject different plugins as needed

```javascript

const inject = pluginjector(myModule)
const newModule = inject({data: 'abc'})
inject({moreData: 'def'})

assert(newModule.data + newModule.moreData === 'abcdef') // true

```

<a name="this"></a>
##### More detail to understand handling of `this` binding
```javascript
const myModule = { val: 1 }

const myPlugin = {
  // `this` will naturally point to parent module for first layer
  //    of methods unless you namespace it
  method(){ return this.val }
  obj1: {
    // all methods here will get `this` bound to parent module
    pluginjectorBindThis: true, // flag, any truthy value
    method(){ return this.val },
    method2(){ return this.obj2.val }
  },
  obj2: {
    // no flag, so these will not get special binding
    val:2,
    method: ()=>{ return this.val }
  },
  obj3: {
    // falsey flag doesn't count
    pluginjectorBindThis: false,
    val:3,
    method: ()=>{ return this.val }
  }
}

let newModule = require('pluginjector')(myModule)(myPlugin)

assert(newModule.method() === 1) // true
assert(newModule.obj1.method() === 1) // true
assert(newModule.obj1.method2() === 2) // true
assert(newModule.obj2.method() === 2) // true
assert(newModule.obj3.method() === 3) // true

// with namespace,but no flag, `this` points to `newModule.plugin`
newModule = require('pluginjector')(myModule)({plugin: myPlugin})
assert(newModule.plugin.method() === 1) // false, `this.val` does not exist

```
