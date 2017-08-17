'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Runner = require('./Runner')
const Test = require('./Test')
const Group = require('./Group')
const listReporter = require('./Reporters/list')

class SlimRunner {
  constructor (globals) {
    this._testReporter = listReporter
    this._testGroups = []
    this._globals = globals
    this._grepOn = null
    this._pushDefaultGroup()
  }

  /**
   * Pushes a default group to the tests groups.
   * This is required to make sure all tests
   * outside of explicit groups are executed
   * in order.
   *
   * @method _pushDefaultGroup
   *
   * @private
   */
  _pushDefaultGroup () {
    this._testGroups.push(new Group('default', this._globals, true))
  }

  /**
   * Returns the latest group from the groups
   * stack.
   *
   * @method _getLatestGroup
   *
   * @return {Object}
   *
   * @private
   */
  _getLatestGroup () {
    return this._testGroups[this._testGroups.length - 1]
  }

  /**
   * Returns whether string contains the substring
   * or not.
   *
   * @method _passesGrep
   *
   * @param  {String}    title
   *
   * @return {Boolean}
   *
   * @private
   */
  _passesGrep (title) {
    if (!this._grepOn) {
      return true
    }
    return title.includes(this._grepOn)
  }

  /**
   * Adds a new test to the latest group
   *
   * @param   {String}   title
   * @param   {Function} callback
   * @param   {Boolean}   skip
   *
   * @private
   */
  _addTest (title, callback, skip, failing) {
    const test = new Test(title, callback, this._globals, skip, failing)
    /**
     * Grep on the test title and make sure it passes the grep
     * pattern if defined. If not we do not push it to the
     * group but still instantiate the test since the
     * end user will be chaining methods on it and
     * it should not throw exception.
     *
     * In short: We create the test but do not execute it
     */
    if (this._passesGrep(title)) {
      const lastGroup = this._getLatestGroup()
      lastGroup.addTest(test)
    }

    return test
  }

  /**
   * Returns the list of groups
   *
   * @return {Array}
   *
   * @private
   */
  getGroups () {
    return this._testGroups
  }

  /**
   * Adds a new test to the relevant test group
   *
   * @method test
   *
   * @param  {String}   title
   * @param  {Function} callback
   * @return {Object}
   */
  test (title, callback) {
    return this._addTest(title, callback, false, false)
  }

  /**
   * Add a skipable test.
   *
   * @method skip
   *
   * @param  {String}   title
   * @param  {Function} callback
   * @return {Object}
   */
  skip (title, callback) {
    return this._addTest(title, callback, true, false)
  }

  /**
   * Create a test that would fail but will be marked
   * as passed.
   *
   * @method failing
   *
   * @param  {String}
   * @param  {Function}
   * @return {Object}
   */
  failing (title, callback) {
    return this._addTest(title, callback, false, true)
  }

  /**
   * Add a new group to have nested tests.
   *
   * @method group
   *
   * @param  {String}   title
   * @param  {Function} callback
   * @return {Object}
   */
  group (title, callback) {
    const group = new Group(title, this._globals)
    this._testGroups.push(group)
    callback(group)

    // Push default group after each test
    this._pushDefaultGroup()
  }

  /**
   * The lord who runs the entire tests stack in sequence
   * by respecting the bail feature and also makes sure
   * to pass the props.emitter instance to the reporter. So
   * that reporter can generate nice output.
   *
   * @method run
   *
   * @return {Promise}
   */
  run () {
    const runner = new Runner(this._testGroups, this._testReporter, this._globals)
    return runner.run()
  }

  /**
   * Toggle the bail status of the runner. Also
   * this needs to be done before calling
   * the run method.
   *
   * @method bail
   *
   * @param  {Boolean} state
   */
  bail (state) {
    this._globals.bail = state
  }

  /**
   * Sets global timeout to be used for all tests.
   *
   * @method timeout
   *
   * @param  {Number} time
   */
  timeout (time) {
    this._globals.timeout = time
  }

  /**
   * Use a third part reporter.
   *
   * @method use
   *
   * @param  {Function} reporter
   */
  use (reporter) {
    this._testReporter = reporter
  }

  /**
   * Grep on test title to run only specific tests.
   *
   * @method grep
   *
   * @param  {String} pattern
   */
  grep (pattern) {
    this._grepOn = pattern
  }
}

module.exports = SlimRunner
