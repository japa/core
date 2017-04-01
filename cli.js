'use strict'

/*
 * japa-cli
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class JapaCli {
  constructor () {
    this._initiate()
  }

  /**
   * Initiate private and public properties
   *
   * @method _initiate
   *
   * @return {void}
   *
   * @private
   */
  _initiate () {
    this.filterCallback = null
    this.ignorePattern = []
    this.testsGlob = 'test/*.spec.js'
  }

  /**
   * Filter files to be used for running the tests. You can
   * return a string, an array of globs or a function
   * which is called for each file.
   *
   * @method filter
   *
   * @param  {String|Array|Function} patternOrCallback
   *
   * @chainable
   */
  filter (patternOrCallback) {
    if (typeof (patternOrCallback) === 'function') {
      this.filterCallback = patternOrCallback
      return this
    }

    if (typeof (patternOrCallback) === 'string') {
      this.ignorePattern = [patternOrCallback]
      return this
    }

    if (patternOrCallback instanceof Array === true) {
      this.ignorePattern = patternOrCallback
      return this
    }

    throw new Error('cli.filter only excepts a glob string, array or a callback function')
  }

  /**
   * Set the glob to be used for picking tests
   * files and then running the tests.
   *
   * @method run
   *
   * @param  {String} glob
   *
   * @return {void}
   */
  run (glob) {
    if (!glob) {
      return
    }

    if (typeof (glob) !== 'string') {
      throw new Error(`cli.run excepts glob pattern to be a string. You passed ${typeof (glob)}`)
    }

    this.testsGlob = glob
  }
}

module.exports = new JapaCli()
