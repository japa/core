'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Middleware = require('./Middleware')
const Test = require('./Test')
const Group = require('./Group')
const emitter = require('../lib/emitter')
const $ = require('../lib/util')

class Runner {
  constructor (bail) {
    this._testReporter = require('../src/Reporters/json')
    this._testGroups = []
    this._pushDefaultGroup()
    this._bail = !!bail
    this.middleware = new Middleware(this, this._bail, this._wrapFn)
  }

  /**
   * Emits the end event for all the tests.
   *
   * @param  {Object|Null}
   */
  _end (error) {
    emitter.emit('end', {
      status: error ? 'failed' : 'passed'
    })
  }

  /**
   * Pushes a default group to the tests groups.
   * This is required to make sure all tests
   * outside of explicit groups are executed
   * in order.
   */
  _pushDefaultGroup () {
    this._testGroups.push(new Group('default', this._bail, true))
  }

  /**
   * Returns the latest group from the groups
   * stack.
   *
   * @return {Object}
   */
  _getLatestGroup () {
    return this._testGroups[this._testGroups.length - 1]
  }

  /**
   * Adds a new test to the latest group
   *
   * @param   {String}   title
   * @param   {Function} callback
   * @param   {Boolean}   skip
   * @private
   */
  _addTest (title, callback, skip) {
    const test = new Test(title, callback, skip)
    const lastGroup = this._getLatestGroup()
    lastGroup.addTest(test)
    return test
  }

  /**
   * Flattens the array stack by forming
   * a new array.
   *
   * @param  {Array}
   * @return {Array}
   */
  _flatten (errorsStack) {
    let flatStack = []
    errorsStack.forEach((error) => {
      if (error instanceof Array) {
        flatStack = flatStack.concat(error)
      } else {
        flatStack.push(error)
      }
    })
    return flatStack
  }

  /**
   * Wraps the group.run as a middleware function.
   *
   * @param  {Function}
   * @param  {Function}
   * @return {Promise}
   */
  _wrapFn (fn, next) {
    return new Promise((resolve, reject) => fn.run().then(next).then(resolve).catch(reject))
  }

  /**
   * Returns the list of groups
   *
   * @return {Array}
   */
  getGroups () {
    return this._testGroups
  }

  /**
   * Adds a new test to the relevant test group
   * @param  {String}   title
   * @param  {Function} callback
   * @return {Object}
   */
  test (title, callback) {
    return this._addTest(title, callback, false)
  }

  /**
   * Add a skipable test.
   *
   * @param  {String}   title
   * @param  {Function} callback
   * @return {Object}
   */
  skip (title, callback) {
    return this._addTest(title, callback, true)
  }

  /**
   * Add a new group to have nested tests.
   * @param  {String}   title
   * @param  {Function} callback
   * @return {Object}
   */
  group (title, callback) {
    const group = new Group(title, this._bail)
    this._testGroups.push(group)
    callback(group)

    // Push default group after each test
    this._pushDefaultGroup()
  }

  /**
   * The lord who runs the entire tests stack in sequence
   * by respecting the bail feature and also makes sure
   * to pass the emitter instance to the reporter. So
   * that reporter can generate nice output.
   *
   * @return {Promise}
   */
  run () {
    if (typeof (this._testReporter) === 'function') {
      this._testReporter(emitter)
    }

    return new Promise((resolve, reject) => {
      this.middleware.compose(this._testGroups)()
      .then(() => {
        if (this.middleware.errorsStack.length) {
          throw this._flatten(this.middleware.errorsStack)
        }
        this._end(null)
        resolve()
      })
      .catch((error) => {
        this._end(error)
        reject(error)
      })
    })
  }

  /**
   * Sets global timeout to be used for all tests.
   *
   * @param  {Number} time
   */
  timeout (time) {
    $.setTimeout(time)
  }

  /**
   * Use a third part reporter.
   *
   * @param  {Function} reporter
   */
  use (reporter) {
    this._testReporter = reporter
  }
}

module.exports = Runner
