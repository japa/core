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

class Runner {
  constructor (stack, reporter, globals) {
    this._reporter = reporter
    this._stack = stack
    this._globals = globals
  }

  /**
   * Emits the end event for all the tests.
   *
   * @method _end
   *
   * @param  {Object|Null}
   *
   * @private
   */
  _end (error) {
    this._globals.emitter.emit('end', {
      status: error ? 'failed' : 'passed',
      error: error || null
    })
  }

  /**
   * Emits the start event when the tests suite
   * starts.
   *
   * @method _start
   *
   * @private
   */
  _start () {
    this._globals.emitter.emit('start')
  }

  /**
   * Flattens the array stack by forming
   * a new array.
   *
   * @param  {Array}
   * @return {Array}
   *
   * @private
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
   * @return {Promise}
   *
   * @private
   */
  _wrapFn (fn) {
    return new Promise((resolve, reject) => fn.run().then(resolve).catch(reject))
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
    if (typeof (this._reporter) === 'function') {
      this._reporter(this._globals.emitter)
    }

    return new Promise((resolve, reject) => {
      const middleware = new Middleware(this, this._wrapFn, this._globals.bail)
      this._start()

      middleware.compose(this._stack)()
      .then(() => {
        if (middleware.errorsStack.length) {
          throw this._flatten(middleware.errorsStack)
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
}

module.exports = Runner
