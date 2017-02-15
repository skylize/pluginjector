/* globals
      describe,
      it
*/

// Note: missing test for if behaves properly when
//   required outside pluginjector directory. Need a way
//   to mimick behavior of being called from diff dir

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
  const inject = (...args) => pluginjector(Core).apply(pluginjector, args)

  function shouldBeCore (core){
    (core).should.be.an('object', 'core')
    ;(core).should.have.property('reqMethod')
      .that.is.a('function')
  }

  it ('Returns valid core when returned with no objects', ()=>{

    const core = inject()
    shouldBeCore(core)
  })


  it('Adds new properties when passed object', ()=>{

    const module = inject({newProp: 'value'})

    shouldBeCore(module)
    ;(module).should.have.property('newProp')
      .that .equals('value')
  })

  it('Adds nested properties when passed an object', ()=>{
    const module = inject({plugin: {newProp: 'value'}})

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

    const module = inject(...pluginArray)

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
    const module = inject(plugin)

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
    const module = inject(plugin)

    shouldBeCore(module)
    ;(module).should.have.property('plugin')
    module.plugin.method() // test is inside the method
  })

  it('Loads plugin from disk if passed a filepath', ()=>{

    const file = './testlib/plugins/bound-plugin'
    const module = inject(file)

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
    const module = inject(file)

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
    const module = inject(plugin)

    ;(module).should.have.property('plugin')
    ;(module.plugin.hasRightThisBinding).should.not.throw()
    ;(module.plugin.hasWrongThisBinding).should.throw()
  })

  it('Loads plugin from directory if set and only a name passed in', ()=>{
    const plugin = 'bound-plugin'
    const dir = './testlib/plugins'
    const inject = pluginjector(Core, {dir})
    const module = inject(plugin)
    inspect(inject.pluginDir)

    ;(module).should.have.property('boundPlugin')
    ;(module.boundPlugin.hasRightThisBinding).should.not.throw()
    ;(module.boundPlugin.hasWrongThisBinding).should.throw()

    delete inject.pluginDir
  })

  it('Fails to load plugin by name if directory not set', ()=>{
    // this test must run before adding a default dir
    function loadCore(){
      const module = inject('bound-plugin')
    }
    (loadCore).should.throw('Pluginjector')

  })


})
