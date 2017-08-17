'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const retry = require('retry')
const Callable = require('./Callable')
const Assertion = require('./Assertion')
const util = require('../lib/util')

class Test {
  constructor (title, callback, globals, skip, regression) {
    this._title = title
    this._skip = !!skip
    this._todo = typeof (callback) !== 'function'
    this._callback = callback
    this._regression = !!regression
    this._regressionMessage = null

    this._globals = globals
    this._timeout = globals.timeout
    this._retry = 0
    this._resolveArgFn = null
  }

  /**
   * Returns the base property for each event emitted
   * by the test.
   *
   * @return {Object}
   */
  get eventBody () {
    return {
      title: this._title,
      status: this._todo ? 'todo' : (this._skip ? 'skipped' : 'pending'),
      regression: this._regression
    }
  }

  /**
   * Returns the 1st argument to be passed to the
   * each test.
   *
   * @method _getArg
   *
   * @param  {String} assert
   *
   * @return {Object}
   *
   * @private
   */
  _getArg (assert) {
    if (typeof (this._resolveArgFn) === 'function') {
      return this._resolveArgFn(assert)
    }
    return assert
  }

  /**
   * Returns the test status
   *
   * @method _getPostRunStatus
   *
   * @param {String|Object} error
   * @return {String}
   *
   * @private
   */
  _getPostRunStatus (error) {
    if (error) {
      return 'failed'
    }

    if (this._todo) {
      return 'todo'
    }

    if (this._skip) {
      return 'skipped'
    }

    return 'passed'
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
        return new Error('Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')

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
   * Emits the {end} event for a given test.
   *
   * @method _end
   *
   * @param {String|Object|Null} error
   * @param {Number} start
   *
   * @private
   */
  _end (error, start) {
    const eventBody = this.eventBody

    eventBody.timeout = !!(
      error && error.message === 'Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.'
    )
    eventBody.error = error || null
    eventBody.duration = new Date() - start
    eventBody.status = this._getPostRunStatus(error)

    /**
     * Attach the regression message if test is regression.
     */
    if (eventBody.regression) {
      eventBody.regressionMessage = this._regressionMessage
    }

    this._globals.emitter.emit(util.eventsList['TEST_END'], eventBody)
  }

  /**
   * Emits the {start} event for a given test.
   *
   * @method _start
   *
   * @private
   */
  _start () {
    this._globals.emitter.emit(util.eventsList['TEST_START'], this.eventBody)
  }

  /**
   * Runs the test as a promise
   *
   * @method _runTest
   *
   * @return {Promise}
   *
   * @private
   */
  _runTest () {
    const assert = new Assertion()
    return new Promise((resolve, reject) => {
      new Callable(this._callback, this._timeout, 1)
      .args([this._getArg(assert)])
      .run()
      .then(() => assert.evaluate())
      .then(() => {
        if (this._regression) {
          reject(new Error('Test was expected to fail'))
          return
        }
        resolve()
      })
      .catch((error) => {
        if (this._regression) {
          this._regressionMessage = error.message
          resolve()
          return
        }
        reject(this._parseError(error))
      })
    })
  }

  /**
   * Public interface to run tests with the
   * the beauty of retries.
   *
   * @method run
   *
   * @return {Promise}
   */
  run () {
    const op = retry.operation({
      retries: this._retry,
      factor: 1
    })

    const start = new Date()

    return new Promise((resolve, reject) => {
      this._start()

      /**
       * If test is a todo, resolve it
       * right away
       */
      if (this._todo) {
        this._end(null, start)
        resolve()
        return
      }

      /**
       * If test is marked as skipped, resolve
       * it right away
       */
      if (this._skip) {
        this._end(null, start)
        resolve()
        return
      }

      op.attempt(() => {
        this
        ._runTest()
        .then(() => {
          this._end(null, start)
          resolve()
        })
        .catch((error) => {
          if (op.retry(error)) {
            return
          }
          this._end(error, start)
          reject(op.mainError())
        })
      })
    })
  }

  /**
   * Attach a callback to customize the 1st argument
   * to be passed to the test callback function.
   *
   * For multiple values, pass an object, which can be
   * destrctured within the callback.
   *
   * @method resolveArg
   *
   * @param  {Function} callback
   *
   * @chainable
   */
  resolveArg (callback) {
    this._resolveArgFn = callback
    return this
  }

  /**
   * Modify test timeout
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

  /**
   * Updates the retry property of a test.
   *
   * @method retry
   *
   * @param {Number} ops
   */
  retry (ops) {
    if (typeof (ops) !== 'number') {
      throw new Error('Make sure retry ops is in numbers')
    }
    if (ops > 3) {
      console.warn('Retrying a test for more than 3 times is not recommended')
    }
    this._retry = ops
  }
}

module.exports = Test
