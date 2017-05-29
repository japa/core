'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class Middleware {
  constructor (context, fnWrapper, bail) {
    this._context = context
    this._fnWrapper = fnWrapper
    this._stack = []
    this._bail = bail
    this.errorsStack = []
  }

  /**
   * Rejects the error by making sure bail is true.
   * Otherwise stacks error for later rejection.
   *
   * @method _internalRejection
   *
   * @param  {Number}
   * @param  {Object}
   * @param  {Function}
   * @param  {Function}
   *
   * @private
   */
  _internalRejection (index, resolve, reject, error) {
    if (this._bail) {
      reject(error)
      return
    }
    this.errorsStack.push(error)
    resolve(this._dispatch(index + 1))
  }

  /**
   * Dispatches each layer of the stack one
   * by one.
   *
   * @method _dispatch
   *
   * @param  {Number}
   * @return {Promise}
   *
   * @private
   */
  _dispatch (index) {
    if (index === this._stack.length) {
      return Promise.resolve()
    }

    const fn = this._stack[index]
    return new Promise((resolve, reject) => {
      this._fnWrapper(fn)
      .then(() => this._dispatch(index + 1))
      .then(resolve)
      .catch((error) => this._internalRejection.bind(this)(index, resolve, reject, error))
    })
  }

  /**
   * Composes a middleware layer to be executed
   * in sequence.
   *
   * @method stack
   *
   * @param  {Array} stack
   * @return {Fuction}
   */
  compose (stack) {
    this._stack = stack
    return function () {
      if (this._stack.length === 0) {
        return Promise.resolve()
      }
      return this._dispatch(0)
    }.bind(this)
  }
}

module.exports = Middleware
