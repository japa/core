'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class Callable {
  constructor (fn, timeout, donePosition) {
    this._validateFn(fn)
    this._validateTimeout(timeout)

    this._fn = fn
    this._timeout = timeout
    this._args = []
    this._timer = null
    this._completed = false
    this._doneCalled = false

    this._needsDone = fn.length - 1 === donePosition
    this._explicitAsync = fn.constructor.name === 'AsyncFunction'
    this._enableTimeouts = this._timeout > 0 && this._timeout < Math.pow(2, 31)
  }

  /**
   * Validates the function to be wrapped as a callable.
   *
   * @method _validateFn
   *
   * @param {Function} fn
   * @throws {Error} if fn is not a function
   *
   * @private
   */
  _validateFn (fn) {
    if (typeof (fn) !== 'function') {
      throw new Error('Make sure to pass a function to the callable instance')
    }
  }

  /**
   * Validate the timeout to be used for timing out the function.
   *
   * @method _validateTimeout
   *
   * @param {Number} timeout
   * @throws {Error} if timeout is not a number
   *
   * @private
   */
  _validateTimeout (timeout) {
    if (typeof (timeout) !== 'number') {
      throw new Error('Make sure timeout is in milliseconds as a number')
    }
  }

  /**
   * Clears the timer if there is
   * any running timer.
   *
   * @method _clearTimer
   *
   * @private
   */
  _clearTimer () {
    if (this._timer) {
      clearTimeout(this._timer)
    }
  }

  /**
   * Calls the fn by passing args.
   *
   * @method _callFn
   *
   * @param {Function} [done]
   * @return {Function}
   *
   * @private
   */
  _callFn (done) {
    return this._fn(...this._args, done)
  }

  /**
   * Resolves the promise and clears the timer
   *
   * @method _internalResolve
   *
   * @param {Function} resolve
   * @return {Function}
   *
   * @private
   */
  _internalResolve (resolve) {
    return () => {
      this._completed = true
      this._clearTimer()
      resolve()
    }
  }

  /**
   * Rejects the promise and clears the timer
   *
   * @method _internalReject
   *
   * @param {Function} reject
   * @return {Function}
   *
   * @private
   */
  _internalReject (reject) {
    return (error) => {
      this._completed = true
      this._clearTimer()
      reject(error)
    }
  }

  /**
   * Pass custom arguments to {this._fn}
   *
   * @method args
   *
   * @param {Array} args
   * @chainable
   */
  args (args) {
    this._args = args
    return this
  }

  /**
   * Run the given function and handle all the hard stuff. Lot's
   * of comments inside the method body.
   *
   * @method run
   *
   * @return {Promise}
   */
  run () {
    return new Promise((resolve, reject) => {
      /**
       * Wrap everything inside a promise in case some method
       * blows before we are able to determine on how to
       * execute them. Very common when making use of
       * {done} callback and top level function dies
       * before calling done.
       */
      try {
        /**
         * STEP 1
         * Start the fn timer to reject the promise when
         * the function never ends itself within the
         * given period of time.
         */
        if (this._enableTimeouts) {
          this._timer = setTimeout(() => {
            this._internalReject(reject)('TIMEOUT')
          }, this._timeout)
        }

        /**
         * STEP 2
         * When method is an explicit {async} function and also
         * accepts {done}, throw an error since both are
         * supported together.
         */
        if (this._explicitAsync && this._needsDone) {
          this._internalReject(reject)('METHOD OVERLOAD:ASYNC')
          return
        }

        /**
         * STEP 3
         * When method is explicit {async}, life is good since
         * we need to call the promise only.
         */
        if (this._explicitAsync) {
          this
          ._callFn()
          .then(this._internalResolve(resolve).bind(this))
          .catch(this._internalReject(reject).bind(this))
          return
        }

        /**
        * STEP 4
         * This is the tricky part where we need to wait for the results to know whether
         * method is async or not. If the return value is a {promise} we need to throw
         * an Exception since async and {done} is not allowed together. Otherwise we
         * let the {done} method decide the fate. Also the async check needs to be
         * with in the {done} method and outside of it, what if user never
         * calls done and returns a {promise}. :/
         */
        if (this._needsDone) {
          const result = this._callFn((error) => {
            /**
             * Don't do anything when method has been executed and
             * we are late to the party
             */
            if (this._completed) {
              return
            }

            /**
             * Throw exception when we enter the party twice for the
             * food. :(
             */
            if (this._doneCalled) {
              this._internalReject(reject)('DONE CALLED TWICE')
              return
            }

            /**
             * We entered the party
             * @type {Boolean}
             */
            this._doneCalled = true

            /**
             * When {done} is called with an error and it
             * is function, then we call the function
             * and catch for errors.
             */
            if (typeof (error) === 'function') {
              try {
                error()
                this._internalResolve(resolve)()
              } catch (doneError) {
                this._internalReject(reject)(doneError)
              }
              return
            }

            /**
             * Otherwise use the error value to reject
             * the promise
             */
            if (error) {
              this._internalReject(reject)(error)
              return
            }

            /**
             * If done is called too early, the value of outside result will be
             * undefined, so wrapping inside the {setTimeout} is the way
             * to go.
             */
            setTimeout(() => {
              /**
               * Ohhhh, {done} was called and the actual result was a {promise}, which
               * is not allowed and considered to be method overloading
               */
              if (typeof (result) !== 'undefined' && typeof (result.then) === 'function') {
                this._internalReject(reject)('METHOD OVERLOAD:PROMISE')
                return
              }

              /**
               * All seems to be fine, so let's resolve the {promise}.
               */
              this._internalResolve(resolve)()
            })
          })

          /**
           * STEP 4.1
           * Reject when {done} was never called and result is a {promise}. If result is
           * not a {promise} then timeout will happen. Removing this check will also
           * work fine, but we need to be more explicit about method overloading.
           */
          if (typeof (result) !== 'undefined' && typeof (result.then) === 'function') {
            this._internalReject(reject)('METHOD OVERLOAD:PROMISE')
          }

          return
        }

        /**
         * STEP 5
         * I do not need {done} and neither I am an {async} function. So
         * call me to see if I am promise, if yes chain then and catch
         * else resolve.
         */
        const result = this._callFn()
        if (result && typeof (result.then) === 'function') {
          result
          .then(this._internalResolve(resolve).bind(this))
          .catch(this._internalReject(reject).bind(this))
          return
        }
        this._internalResolve(resolve)()
      } catch (error) {
        this._internalReject(reject)(error)
      }
    })
  }
}

module.exports = Callable
