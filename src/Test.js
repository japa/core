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
const $ = require('../lib/util')
const emitter = require('../lib/emitter')

const eventsList = $.getEventsList()

class Test {
  constructor (title, callback, skip) {
    this._title = title
    this._skip = !!skip
    this._todo = typeof (callback) !== 'function'
    this._timeout = $.getTimeout()
    this._callback = callback
    this._retry = 0
    this.assert = new Assertion()
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
      status: this._todo ? 'todo' : (this._skip ? 'skipped' : 'pending')
    }
  }

  /**
   * Returns the test status
   *
   * @param {String|Object} error
   * @return {String}
   */
  _getTestStatus (error) {
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
   * @param {String|Object|Null} error
   * @return {Object}
   */
  _parseError (error) {
    if (error && error.message) {
      return error
    }

    switch (error) {
      case 'TIMEOUT':
        return new Error('Test timeout, make sure to call done() or increase timeout')

      case 'METHOD OVERLOAD:PROMISE':
        return new Error('Method overload, return a promise or make use of the done callback')

      case 'METHOD OVERLOAD:ASYNC':
        return new Error('Method overload, async functions should not make use of done callback')

      case 'DONE CALLED TWICE':
        return new Error('Make sure you are not calling done more than once')

      default:
        return error
    }
  }

  /**
   * Emits the {end} event for a given test.
   *
   * @param {String|Object|Null} error
   * @param {Number} start
   */
  _end (error, start) {
    const eventBody = this.eventBody

    eventBody.timeout = !!(error && error.message === 'Test timeout, make sure to call done() or increase timeout')
    eventBody.error = error || null
    eventBody.duration = new Date() - start
    eventBody.status = this._getTestStatus(error)

    emitter.emit(eventsList['TEST_END'], eventBody)
  }

  /**
   * Emits the {start} event for a given test.
   */
  _start () {
    emitter.emit(eventsList['TEST_START'], this.eventBody)
  }

  /**
   * Runs the test as a promise
   *
   * @return {Promise}
   */
  _runTest () {
    return new Promise((resolve, reject) => {
      this._start()
      const start = new Date()

      /**
       * If test is a todo, resolve it
       * right away
       */
      if (this._todo) {
        this._end(null, start)
        resolve()
      }

      /**
       * If test is marked as skipped, resolve
       * it right away
       */
      if (this._skip) {
        this._end(null, start)
        resolve()
      }

      new Callable(this._callback, this._timeout, 1)
      .args([this.assert])
      .run()
      .then(() => this.assert.evaluate())
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
   * Public interface to run tests with the
   * the beauty of retries.
   *
   * @return {Promise}
   */
  run () {
    const op = retry.operation({
      retries: this._retry
    })

    return new Promise((resolve, reject) => {
      op.attempt(() => {
        this
        ._runTest()
        .then(resolve)
        .catch((error) => {
          if (op.retry(error)) {
            return
          }
          reject(op.mainError())
        })
      })
    })
  }

  /**
   * Modify test timeout
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
