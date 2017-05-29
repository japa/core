'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Callable = require('./Callable')
const util = require('../lib/util')

class Hook {
  constructor (groupTitle, hookFor, callback, globals) {
    this._title = groupTitle
    this._hookFor = hookFor
    this._callback = callback
    this._globals = globals
    this._timeout = globals.timeout
  }

  /**
   * Parses the error. If error is a string, it will
   * get converted to a valid error object.
   *
   * @method _parseError
   *
   * @param {String|Object|Null} error
   * @return {Object}
   *
   * @private
   */
  _parseError (error) {
    if (error && error.message) {
      return error
    }

    switch (error) {
      case 'TIMEOUT':
        return new Error('Hook timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')

      case 'METHOD OVERLOAD:PROMISE':
        return new Error('Method overload, returning promise and making use of "done()" is not allowed together')

      case 'METHOD OVERLOAD:ASYNC':
        return new Error('Method overload, async functions and making use of "done()" is not allowed together')

      case 'DONE CALLED TWICE':
        return new Error('Make sure you are not calling "done()" more than once')

      default:
        return error
    }
  }

  /**
   * Emits the {end} event for a given hook.
   *
   * @method _end
   *
   * @param {String|Object|Null} error
   * @param {Number} start
   *
   * @private
   */
  _end (error, start) {
    this._globals.emitter.emit(util.eventsList['GROUP_HOOK_END'][this._hookFor], {
      title: this._title,
      status: error ? 'failed' : 'passed',
      error: error || null,
      duration: new Date() - start
    })
  }

  /**
   * Emits the {start} event for a given hook.
   *
   * @method _start
   *
   * @private
   */
  _start () {
    this._globals.emitter.emit(util.eventsList['GROUP_HOOK_START'][this._hookFor], {
      title: this._title,
      status: 'pending'
    })
  }

  /**
   * Runs the hook as a promise
   *
   * @method run
   *
   * @return {Promise}
   */
  run () {
    return new Promise((resolve, reject) => {
      this._start()
      const start = new Date()

      new Callable(this._callback, this._timeout, 0)
      .run()
      .then(() => {
        this._end(null, start)
        resolve()
      })
      .catch((error) => {
        error = this._parseError(error)
        this._end(error, start)
        reject(error)
      })
    })
  }

  /**
   * Modify hook timeout
   *
   * @method timeout
   *
   * @param {Number} time
   */
  timeout (time) {
    if (typeof (time) !== 'number') {
      throw new Error('Make sure timeout is in milliseconds as a number')
    }
    this._timeout = time
  }
}

module.exports = Hook
