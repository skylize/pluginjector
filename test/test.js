/* globals
      describe,
      it
*/
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

  function shouldBeCore (core){
    (core).should.be.an('object', 'core')
    ;(core).should.have.property('reqMethod')
      .that.is.a('function')
  }


  it ('Returns valid core when returned with no objects', ()=>{

    const core = Core()
    shouldBeCore(core)
  })


  it('Adds new properties when passed object', ()=>{

    const core = Core({newProp: 'value'})

    shouldBeCore(core)
    ;(core).should.have.property('newProp')
      .that.equals('value')

    delete core.newProp
  })


  it('Adds nested properties when passed an object', ()=>{

    const core = Core({plugin: {newProp: 'value'}})

    shouldBeCore(core)
    ;(core).should.have.property('plugin')
      .that.is.a('object')
    ;(core.plugin).should.have.property('newProp')
      .that.equals('value')

    delete core.newProp
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
    const core = Core(...pluginArray)

    shouldBeCore(core)
    ;(core).should.have.property('plugin1')
    ;(core.plugin1).should.have.property('val')
      .that.equals(1)
    ;(core).should.have.property('plugin2')
    ;(core.plugin2).should.have.property('val')
      .that.equals('two')

    delete core.plugin1
    delete core.plugin2
  })

  it('Allows `this` to point to core for plugin methods', ()=>{
    const plugin = {
      method(){
        (this).should.have.property('reqMethod')
          .that.is.a('function')
      }
    }
    const core = Core(plugin)

    shouldBeCore(core)
    core.method() // test is insidethe method

    delete core.method
  })

  it('Binds `this` to core for namespaced plugin methods', ()=>{

    const plugin = {
      plugin: {
        pluginjectorBindThis: true,
        method(){
          (this).should.have.property('reqMethod').that.is.a('function')
        }
      }
    }
    const core = Core(plugin)

    shouldBeCore(core)
    ;(core).should.have.property('plugin')
    core.plugin.method() // test is inside the method

    delete core.plugin
  })

  it('Loads plugin from disk if passed a filepath', ()=>{

    const file = './testlib/plugins/bound-plugin'
    const core = Core(file)

    shouldBeCore(core)
    ;(core).should.have.property('boundPlugin')
    ;(core.boundPlugin).should.have.property('hasRightThisBinding')
    ;(core.boundPlugin.hasRightThisBinding)
      .should.not.throw()
    ;(core.boundPlugin.hasWrongThisBinding)
      .should.throw()

    delete core.boundPlugin
  })

  it('Does not bind `this` if user forgets pluginjectorBindThis property', ()=>{

    const file = './testlib/plugins/unbound-plugin'
    const core = Core(file)

    shouldBeCore(core)
    ;(core).should.have.property('unboundPlugin')
    ;(core.unboundPlugin).should.have.property('hasRightThisBinding')
    ;(core.unboundPlugin.hasRightThisBinding)
      .should.throw()
    ;(core.unboundPlugin.hasWrongThisBinding)
      .should.not.throw()

    delete core.unboundPlugin
  })

  it('Loads plugin from disk if passed a plugin name & string', ()=>{
    const file = './testlib/plugins/bound-plugin'
    const plugin = {plugin: file, pluginjectorNamedFile: true}
    const core = Core(plugin)

    // inspect(core)
    ;(core).should.have.property('plugin')
    ;(core.plugin.hasRightThisBinding).should.not.throw()
    ;(core.plugin.hasWrongThisBinding).should.throw()

    delete core.plugin
  })

  it('Fails to load plugin by name if directory not set', ()=>{

    // this test must run before setting directory
    function loadCore(){
      const core = Core('bound-plugin')
    }
    (loadCore).should.throw('Pluginjector')

  })

  it('Loads plugin from if directory set and only a name passed in', ()=>{
    // This test sets the plugin directory. There is no mechanism to unset it.
    // So this test must be run after any tests that require directory not set.
    const plugin = 'bound-plugin'
    const dirCoreFile = '../testlib/core-with-plugin-dir.js'
    const core = require(dirCoreFile)('bound-plugin')

    ;(core).should.have.property('boundPlugin')
    ;(core.boundPlugin.hasRightThisBinding).should.not.throw()
    ;(core.boundPlugin.hasWrongThisBinding).should.throw()

    // no way to unset directory, but clean everything else
    delete core.boundPlugin

  })
})
