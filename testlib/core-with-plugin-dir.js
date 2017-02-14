const pluginjector = require('../')

const core = {
  val1: 1,
  val2: 'two',
  method () {
    console.log('core method called')
  },
  reqMethod () {
    console.log('method with this name is required to identify as core object')
  }
}

module.exports = pluginjector(core, {dir: './testlib/plugins'})
