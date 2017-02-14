const assert = require('assert')

const fakePlugin = {
  pluginjectorBindThis: true,

  val: 1,

  // `this.request` exists means `this` is properly pointing to core module
  hasRightThisBinding(){
    assert(!!this.reqMethod)
  },

  hasWrongThisBinding(){
    assert(!this.reqMethod)
  }
}

module.exports = fakePlugin
