/**
 * @module Core
 */

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Hook } from '../Hook'
import { Test } from '../Test'
import { emitter } from '../Emitter'
import {
  ICallback,
  IResolver,
  IGroupReport,
  IGroupStatus,
  IEvents,
  ITestStatus,
  ITestOptions,
  IOptions,
} from '../Contracts'

/**
 * Group holds `n` number of tests to be executed. Groups also allows
 * defining hooks to be called before and after each test and the
 * group itself.
 */
export class Group <T extends any[], H extends any[]> {
  private _hooks: {
    before: Hook<H>[],
    after: Hook<H>[],
    beforeEach: Hook<H>[],
    afterEach: Hook<H>[],
  } = {
      before: [],
      after: [],
      beforeEach: [],
      afterEach: [],
    }

  /**
   * Timeout defined on group will be applied to
   * all the tests by default.
   */
  private _timeout: number

  /**
   * The test error (if any)
   */
  private _error: Error | null = null

  /**
   * Has test been executed
   */
  private _completed: boolean = false

  /**
   * An array of tests related to the group. They are mutated by the
   * run method to filter and keep only the one's that matches
   * the grep filter.
   */
  private _tests: Test<T>[] = []

  /**
   * Storing whether the group has any failing tests or
   * not.
   */
  private _hasFailingTests = false

  /**
   * Is there a cherry picked test using the `only` property
   * or not?
   */
  private _hasCherryPickedTest = false

  constructor (
    public title: string,
    private _resolveTestFn: IResolver<T>,
    private _resolveHookFn: IResolver<H>,
    private _options: IOptions) {
  }

  /**
   * Returns a boolean telling if group or any of the tests inside
   * the group has errors.
   */
  public get hasErrors (): boolean {
    return this._hasFailingTests || !!this._error
  }

  /**
   * Filter tests if grep value is defined
   */
  private _filterTests () {
    if (!this._options.grep) {
      return
    }

    const filteredTests = this._tests.filter((test) => this._options.grep!.test(test.title))
    this._tests = filteredTests
  }

  /**
   * Run a hook and if it raises error, then we will
   * set the completed flag to true, along with the
   * error.
   */
  private async _runHook (fn: Hook<H>) {
    try {
      await fn.run()
    } catch (error) {
      this._completed = true
      this._error = error
    }
  }

  /**
   * Runs a single test along side with it's hooks.
   */
  private async _runTest (test: Test<T>) {
    /**
     * Run beforeEach hooks
     */
    for (let hook of this._hooks.beforeEach) {
      if (this._completed) {
        break
      }

      await this._runHook(hook)
    }

    /**
     * Return early if completed is set to true (happens when any hook throws error)
     */
    if (this._completed) {
      return
    }

    /**
     * Otherwise run the test
     */
    await test.run()

    /**
     * Setting flag to true when any one test has failed. This helps
     * in telling runner to exit process with the correct status.
     */
    const testFailed = test.toJSON().status === ITestStatus.FAILED
    if (!this._hasFailingTests && testFailed) {
      this._hasFailingTests = true
    }

    /**
     * Mark group as completed when bail is set to true and
     * test has failed
     */
    if (this._options.bail && testFailed) {
      this._completed = true
      return
    }

    /**
     * Run all after each hooks
     */
    for (let hook of this._hooks.afterEach) {
      if (this._completed) {
        break
      }

      await this._runHook(hook)
    }
  }

  /**
   * Runs all the tests one by one and also executes
   * the beforeEach and afterEach hooks
   */
  private async _runTests () {
    /**
     * Run all the tests in sequence. If any hook beforeEach or afterEach
     * hook fails, it will set `complete = true` and then we break out
     * of the loop, since if hooks are failing, then there is no
     * point is running tests.
     */
    for (let test of this._tests) {
      if (this._completed) {
        break
      }

      await this._runTest(test)
    }
  }

  /**
   * Returns the JSON report for the group. The output of this
   * method is emitted as an event.
   */
  public toJSON (): IGroupReport {
    let status = IGroupStatus.PENDING

    if (this._completed && this._error) {
      status = IGroupStatus.FAILED
    } else if (this._completed) {
      status = IGroupStatus.PASSED
    }

    return {
      title: this.title,
      status: status,
      error: this._error,
    }
  }

  /**
   * Define timeout for all the tests inside the group. Still
   * each test can override it's own timeout.
   */
  public timeout (duration: number): this {
    if (typeof (duration) !== 'number') {
      throw new Error('"group.timeout" expects a valid integer')
    }

    if (this._tests.length) {
      throw new Error('group.timeout must be called before defining the tests')
    }

    this._timeout = duration
    return this
  }

  /**
   * Create a new test as part of this group.
   */
  public test (title: string, callback: ICallback<T>, testOptions?: Partial<ITestOptions>): Test<T> {
    if (!title.trim()) {
      throw new Error('test title cannot be empty')
    }

    testOptions = Object.assign({
      regression: false,
      skip: false,
      skipInCI: false,
      runInCI: false,
    }, testOptions)

    /**
     * Using group timeout as a priority over runner timeout
     */
    testOptions.timeout = this._timeout !== undefined ? this._timeout : this._options.timeout
    const test = new Test(title, this._resolveTestFn, callback, testOptions as ITestOptions)

    /**
     * Do not track test when a test has been cherry picked earlier
     */
    if (this._hasCherryPickedTest) {
      return test
    }

    /**
     * Remove all existing tests, when a test has a `.only` property
     * set to true.
     */
    if (testOptions.only === true) {
      this._hasCherryPickedTest = true
      this._tests = []
    }

    this._tests.push(test)
    return test
  }

  /**
   * Add before hook to be executed before the group starts
   * executing tests.
   */
  public before (cb: ICallback<H>): this {
    if (typeof (cb) !== 'function') {
      throw new Error('"group.before" expects callback to be a valid function')
    }

    this._hooks.before.push(new Hook(this._resolveHookFn, cb, 'before'))
    return this
  }

  /**
   * Add after hook to be executed after the group has executed
   * all the tests.
   */
  public after (cb: ICallback<H>): this {
    if (typeof (cb) !== 'function') {
      throw new Error('"group.after" expects callback to be a valid function')
    }

    this._hooks.after.push(new Hook(this._resolveHookFn, cb, 'after'))
    return this
  }

  /**
   * Add before each hook to be execute before each test
   */
  public beforeEach (cb: ICallback<H>): this {
    if (typeof (cb) !== 'function') {
      throw new Error('"group.beforeEach" expects callback to be a valid function')
    }

    this._hooks.beforeEach.push(new Hook(this._resolveHookFn, cb, 'beforeEach'))
    return this
  }

  /**
   * Add after each hook to be execute before each test
   */
  public afterEach (cb: ICallback<H>): this {
    if (typeof (cb) !== 'function') {
      throw new Error('"group.afterEach" expects callback to be a valid function')
    }

    this._hooks.afterEach.push(new Hook(this._resolveHookFn, cb, 'afterEach'))
    return this
  }

  /**
   * Run the group with it's hooks and all tests. Shouldn't be called
   * by the end user and Japa itself will call this method
   */
  public async run () {
    this._filterTests()

    /**
     * Return early when no tests are defined
     */
    if (!this._tests.length) {
      this._completed = true
      return
    }

    emitter.emit(IEvents.GROUPSTARTED, this.toJSON())

    /**
     * Run all before hooks for the group
     */
    for (let hook of this._hooks.before) {
      if (this._completed) {
        break
      }

      await this._runHook(hook)
    }

    /**
     * Run the tests, if complete flag is not set to true. It is
     * set to true, when any before hooks fail
     */
    if (!this._completed) {
      await this._runTests()
    }

    /**
     * Run all after hooks
     */
    for (let hook of this._hooks.after) {
      if (this._completed) {
        break
      }
      await this._runHook(hook)
    }

    this._completed = true
    emitter.emit(IEvents.GROUPCOMPLETED, this.toJSON())
  }
}
