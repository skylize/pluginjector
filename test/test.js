/* globals
      describe,
      it
*/

// **Note: missing test(s) for proper directory traversal when
//   importing files.

const should = require('chai').should()
  , util = require('util')

  , inspect = (...args) => {
    if (args.length) console.log('\ninspecting from test:')
    args.forEach( obj=>{ console.log(
      util.inspect(obj, {
        depth: 4,
        colors:true,
        maxArrayLength: 5
      })
    )})
  }

describe ('Core module factory call', ()=> {

  // Minimum required signature for valid core
  //  core {
  //    reqMethod: [function]
  //  }
  const Core = require('../testlib/core.js')
  const pluginjector = require('../')

  function shouldBeCore (core){
    (core).should.be.an('object', 'core')
    ;(core).should.have.property('reqMethod')
      .that.is.a('function')
  }

  it ('Returns valid core when returned with no objects', ()=>{

    const core = pluginjector(Core)()
    shouldBeCore(core)
  })


  it('Adds new properties when passed object', ()=>{

    const module = pluginjector(Core)({newProp: 'value'})

    shouldBeCore(module)
    ;(module).should.have.property('newProp')
      .that .equals('value')
  })

  it('Adds nested properties when passed an object', ()=>{
    const module = pluginjector(Core)({plugin: {newProp: 'value'}})

    shouldBeCore(module)
    ;(module).should.have.property('plugin')
      .that.is.a('object')
    ;(module.plugin).should.have.property('newProp')
      .that.equals('value')
  })


  it('Adds properties from each of multiple objects passed in', ()=>{

    const pluginArray = [
      { plugin1: {
        val: 1
      } },
      { plugin2: {
        val: 'two'
      } }
    ]

    const module = pluginjector(Core)(...pluginArray)

    shouldBeCore(module)
    ;(module).should.have.property('plugin1')
    ;(module.plugin1).should.have.property('val')
      .that.equals(1)
    ;(module).should.have.property('plugin2')
    ;(module.plugin2).should.have.property('val')
      .that.equals('two')

    delete module.plugin1
    delete module.plugin2
  })

  it('Allows `this` to naturally point to core for plugin methods', ()=>{
    const plugin = {
      method(){
        (this).should.have.property('reqMethod')
          .that.is.a('function')
      }
    }
    const module = pluginjector(Core)(plugin)

    shouldBeCore(module)
    module.method() // test is inside the method
  })

  it('Binds `this` to core for namespaced plugin methods', ()=>{

    const plugin = {
      plugin: {
        pluginjectorBindThis: true,
        method(){
          (this).should.have.property('reqMethod')
            .that.is.a('function')
        }
      }
    }
    const module = pluginjector(Core)(plugin)

    shouldBeCore(module)
    ;(module).should.have.property('plugin')
    module.plugin.method() // test is inside the method
  })

  it('Loads plugin from disk if passed a filepath', ()=>{

    const file = './testlib/plugins/bound-plugin'
    const module = pluginjector(Core)(file)

    shouldBeCore(module)
    ;(module).should.have.property('boundPlugin')
    ;(module.boundPlugin).should.have.property('hasRightThisBinding')
    ;(module.boundPlugin.hasRightThisBinding)
      .should.not.throw()
    ;(module.boundPlugin.hasWrongThisBinding)
      .should.throw()
  })
  //
  it('Does not bind `this` if user forgets pluginjectorBindThis property', ()=>{

    const file = './testlib/plugins/unbound-plugin'
    const module = pluginjector(Core)(file)

    shouldBeCore(module)
    ;(module).should.have.property('unboundPlugin')
    ;(module.unboundPlugin).should.have.property('hasRightThisBinding')
    ;(module.unboundPlugin.hasRightThisBinding)
      .should.throw()
    ;(module.unboundPlugin.hasWrongThisBinding)
      .should.not.throw()
  })

  it('Loads plugin from disk if passed a plugin name & string', ()=>{
    const file = './testlib/plugins/bound-plugin'
    const plugin = {plugin: file, pluginjectorNamedFile: true}
    const module = pluginjector(Core)(plugin)

    ;(module).should.have.property('plugin')
    ;(module.plugin.hasRightThisBinding).should.not.throw()
    ;(module.plugin.hasWrongThisBinding).should.throw()
  })

  it('Loads plugin from directory if set and only a name passed in', ()=>{
    const plugin = 'bound-plugin'
    const dir = './testlib/plugins'

    const inject = pluginjector(Core, {dir})
    const module = inject(plugin)

    ;(module).should.have.property('boundPlugin')
    ;(module.boundPlugin.hasRightThisBinding).should.not.throw()
    ;(module.boundPlugin.hasWrongThisBinding).should.throw()

    // clean up
    delete inject.pluginDir
  })

  it('Fails to load plugin by name if directory not set', ()=>{
    function loadCore(){
      const module = pluginjector(Core)('bound-plugin')
    }
    (loadCore).should.throw('Cannot find module')

  })

  it('Returns copies on repeated calls to `pluginjector`', ()=>{

    const plugin = {key:'value'}

    const module1 = pluginjector(Core)(plugin)
    ;(module1).should.have.property('key').that.equals('value')

    const module2 = pluginjector(Core)({})
    ;(module2).should.not.have.property('key')

    ;(module1).should.not.equal(module2)
  })

  it('Returns same object on repeated calls to inject',()=>{

    const plugin = {key:'value'}
    const inject = pluginjector(Core)

    const module1 = inject(plugin)
    const module2 = inject(plugin)

    ;(module1).should.equal(module2)
  })

  it('Lazily injects exactly as described in readme', ()=>{
    const inject = pluginjector({})
    const newModule = inject({data: 'abc'})
    inject({moreData: 'def'})

    ;(newModule.data + newModule.moreData).should.equal('abcdef')
  })

  it('Uses core as prototype when `proto` option is true', ()=>{
    const module = pluginjector(Core, {proto: true})({})
    ;(Core.isPrototypeOf(module)).should.equal(true)
  })

  it('Does not use core as prototype by default', ()=>{
    const module = pluginjector(Core)({})
    ;(Core.isPrototypeOf(module)).should.not.equal(true)
  })
})
