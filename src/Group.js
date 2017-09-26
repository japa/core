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
const util = require('../lib/util')

class Group {
  constructor (title, globals, isRoot) {
    this._title = title
    this._globals = globals

    /**
     * A root group where tests are not nested intentionally
     * by the user but group was created by the runner for
     * the sake of simplicity.
     */
    this._isRoot = !!isRoot

    /**
     * Hooks to be executed
     */
    this._hooks = {
      beforeEach: [],
      afterEach: [],
      before: [],
      after: []
    }

    this._tests = []
    this.middleware = new Middleware(this, this._wrapFn, this._globals.bail)
  }

  /**
   * Emits the start event for the group
   *
   * @method _start
   *
   * @private
   */
  _start () {
    if (this._isRoot) {
      return
    }

    this._globals.emitter.emit(util.eventsList['GROUP_START'], {
      title: this._title,
      status: 'pending'
    })
  }

  /**
   * Emits the end event for the group.
   *
   * @method _end
   *
   * @param {Object|Null} error
   *
   * @private
   */
  _end (error) {
    if (this._isRoot) {
      return
    }

    this._globals.emitter.emit(util.eventsList['GROUP_END'], {
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
      /* eslint prefer-promise-reject-errors: "off" */
      reject({title: fn._title, error: error})
    }))
  }

  /**
   * Composing tests in an order they should be executed. It
   * also includes the lifecycle hooks.
   *
   * @method _composeStack
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
   * Add a new closure to the before hooks stack.
   *
   * @method before
   *
   * @param {Function} callback
   *
   * @return {Hook} Instance of hook
   */
  before (callback) {
    const hook = new Hook(this._title, 'before', callback, this._globals)
    this._hooks.before.push(hook)
    return hook
  }

  /**
   * Add a new closure to the beforeEach hooks stack.
   *
   * @method beforeEach
   *
   * @param {Function} callback
   *
   * @return {Hook} Instance of hook
   */
  beforeEach (callback) {
    const hook = new Hook(this._title, 'beforeEach', callback, this._globals)
    this._hooks.beforeEach.push(hook)
    return hook
  }

  /**
   * Add a new closure to the after hooks stack.
   *
   * @method after
   *
   * @param {Function} callback
   *
   * @return {Hook} Instance of hook
   */
  after (callback) {
    const hook = new Hook(this._title, 'after', callback, this._globals)
    this._hooks.after.push(hook)
    return hook
  }

  /**
   * Add a new closure to the afterEach hooks stack.
   *
   * @method afterEach
   *
   * @param {Function} callback
   *
   * @return {Hook} Instance of hook
   */
  afterEach (callback) {
    const hook = new Hook(this._title, 'afterEach', callback, this._globals)
    this._hooks.afterEach.push(hook)
    return hook
  }

  /**
   * Add a test to be added to the groups
   * stack.
   *
   * @method addTest
   *
   * @param {Object} test callerInstance
   */
  addTest (test) {
    this._tests.push(test)
  }

  /**
   * Run tests with their hooks. All errors will be stacked
   * and returned as nested arrays.
   *
   * @method run
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
