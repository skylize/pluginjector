const path = require('path')
    , util = require('util')
    , inspect = (...args) => {
      if (args.length) console.log('\ninspecting from index:')
      args.forEach( obj=>{ console.log(
        util.inspect(obj, {
          depth: 4,
          colors:true,
          maxArrayLength: 5
        })
      )})
    }
    , inspectThis = (ths) => {
      (ths === global) ? console.log('this === global')
        : inspect(ths)
    }

/*********************************************************/

function pluginjector (core, opts){
  core = Object.create(core)

  this.getPluginDir = ()=>piInject.pluginDir
  if (opts && opts.dir) piInject.pluginDir = opts.dir

  return piInject

  function piInject (...args){
    const plugins = args.map(plugin => {
      if (typeof plugin === 'string') {
        plugin = getPluginFromFile(plugin)
      }
      traverseAndImportFromFile(plugin, core)
      traverseAndBindThisIfRequested(plugin, core)
      return (plugin)
    })

    Object.assign(core, ...plugins)
    return core
  }
}

module.exports = pluginjector


/*********************************************************/

function traverseAndImportFromFile(obj, parent){
  for (var k in obj) { if (obj.hasOwnProperty(k)){
    if (k === 'pluginjectorNamedFile' && obj[k] == true){
      delete obj[k] // did its job. remove it for cleaner objects
      let keys = Object.keys(obj)
      if (keys.length !== 1)
        throw new Error('Pluginjector found too many properties in namespace wrapper.')
      let plugin = getPluginFromFile(obj[keys[0]], keys[0])
      delete obj[keys[0]]
      Object.assign(obj, plugin)
    }
    if (obj === Object(obj))
      traverseAndImportFromFile(obj[k])
  }}
}


function bindThis (obj, targetThis){
  for (var k in obj){
    if (typeof obj[k] === 'function')
      obj[k] = obj[k].bind(targetThis)
  }
}

function traverseAndBindThisIfRequested(obj, targetThis){
  for (var k in obj) {
    if (obj.hasOwnProperty(k)){
      if (k === 'pluginjectorBindThis' && obj[k] == true){
        delete obj[k] // did its job. remove it for cleaner objects
        bindThis(obj, targetThis)
      }
      if (obj === Object(obj))
        traverseAndBindThisIfRequested(obj[k], targetThis)
    }
  }
}

function getPluginFromFile(file, key){

  key = key || makeKeyNameFromFilePath(file)
  // check if string is only word chars
  let nameMatch = file.match(/^[\w-]*$/)
  // if only name provided then build path from pluginDir
  let dir = this.getPluginDir()
  if (nameMatch && dir) {
    let file = path.join(dir, nameMatch[0])

    file = [dir, nameMatch[0]].join('/')
    return getPluginFromFile(file, key)
  }
  let obj = {}
  // if looks like relative path, then make absolute
  if ( ! file.match(/^(\/|[A-Za-z]:)/) )
    file = path.join(process.cwd(),file)
  try{
    obj[key] = require(file)
    return obj
  }catch(e){
    throw new Error(`Pluginjector failed to load plugin ${file}`)
  }
}

function makeKeyNameFromFilePath(path){
  // extract name of file without directories or extension
  return path.match(/[^\\\/]+(?=\.[\w]+$)|[^\\\/]+$/)[0]
    // convert dashes or spaces to camelcase
    .replace(/(-|\s|\.)+([\w])/g, (...args) => {
      return args[2].toUpperCase()
    })
}
