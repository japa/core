'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Hook = require('./Hook')
const Middleware = require('./Middleware')
const $ = require('../lib/util')
const emitter = require('../lib/emitter')

const eventsList = $.getEventsList()

class Group {
  constructor (title, bail, isRoot) {
    this._title = title
    this._isRoot = !!isRoot
    this._timeout = $.getTimeout()
    this._hooks = {
      beforeEach: [],
      afterEach: [],
      before: [],
      after: []
    }
    this._tests = []
    this.middleware = new Middleware(this, !!bail, this._wrapFn)
  }

  /**
   * Emits the start event for the group
   */
  _start () {
    if (this._isRoot) {
      return
    }

    emitter.emit(eventsList['GROUP_START'], {
      title: this._title,
      status: 'pending'
    })
  }

  /**
   * Emits the end event for the group
   *
   * @param {Object|Null} error
   */
  _end (error) {
    if (this._isRoot) {
      return
    }

    emitter.emit(eventsList['GROUP_END'], {
      title: this._title,
      status: error ? 'failed' : 'passed',
      errors: error || null
    })
  }

  /**
   * Wraps the test/hook as a middleware fn
   *
   * @param   {Object}   fn
   * @return  {Promise}
   *
   * @private
   */
  _wrapFn (fn) {
    return new Promise((resolve, reject) => fn.run().then(resolve).catch((error) => {
      reject({title: fn._title, error: error})
    }))
  }

  /**
   * Composing tests in an order they should be executed. It
   * also includes the lifecycle hooks.
   *
   * @return  {Array}
   *
   * @private
   */
  _composeStack () {
    const testStack = []

    /**
     * Pushing the before hooks at the start of
     * the testStack
     */
    this._hooks.before.forEach((hook) => testStack.push(hook))

    this._tests.forEach((test) => {
      /**
       * Pushing the before hooks at the start of
       * each test
       */
      this._hooks.beforeEach.forEach((hook) => testStack.push(hook))

      /**
       * Pushing test to the testStack
       */
      testStack.push(test)

      /**
       * Pushing after each hook after each test.
       */
      this._hooks.afterEach.forEach((hook) => testStack.push(hook))
    })

    /**
     * Pushing the after hook after all the tests
     * in the testStack
     */
    this._hooks.after.forEach((hook) => testStack.push(hook))

    return testStack
  }

  /**
   * Add a new closure to the before hook
   *
   * @param {Function} callback
   */
  before (callback) {
    const hook = new Hook(this._title, 'before', callback)
    this._hooks.before.push(hook)
    return hook
  }

  /**
   * Add a new closure to the beforeEach hook
   *
   * @param {Function} callback
   */
  beforeEach (callback) {
    const hook = new Hook(this._title, 'beforeEach', callback)
    this._hooks.beforeEach.push(hook)
    return hook
  }

  /**
   * Add a new closure to the after hook
   *
   * @param {Function} callback
   */
  after (callback) {
    const hook = new Hook(this._title, 'after', callback)
    this._hooks.after.push(hook)
    return hook
  }

  /**
   * Add a new closure to the afterEach hook
   *
   * @param {Function} callback
   */
  afterEach (callback) {
    const hook = new Hook(this._title, 'afterEach', callback)
    this._hooks.afterEach.push(hook)
    return hook
  }

  /**
   * Add a test to be added to the groups
   * stack.
   *
   * @param {Object} test callerInstance
   */
  addTest (test) {
    this._tests.push(test)
  }

  /**
   * Run tests with their hooks
   *
   * @return {Promise}
   */
  run () {
    this._start()
    const composedTests = this._composeStack()

    return new Promise((resolve, reject) => {
      this.middleware.compose(composedTests)()
      .then(() => {
        if (this.middleware.errorsStack.length) {
          throw this.middleware.errorsStack
        }
        this._end()
        resolve()
      })
      .catch((error) => {
        error = error instanceof Array === true ? error : [error]
        this._end(error)
        reject(error)
      })
    })
  }
}

module.exports = Group
