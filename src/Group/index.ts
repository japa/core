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

import ow from 'ow'
import { Hook } from '../Hook'
import { Test } from '../Test'
import { emitter } from '../Emitter'
import { ICallback, IResolver, IGroupReport, IGroupStatus, IEvents, ITestOptions } from '../Contracts'

/**
 * Group holds `n` number of tests to be executed. Groups also allows
 * defining hooks to be called before and after each test and the
 * group itself.
 */
export class Group <T extends any[]> {
  private _hooks: {
    before: Hook<T>[],
    after: Hook<T>[],
    beforeEach: Hook<T>[],
    afterEach: Hook<T>[],
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
   * An array of tests related to the group
   */
  private _tests: Test<T>[] = []

  constructor (private _title: string, private _resolveFn: IResolver<T>) {
  }

  /**
   * Run a hook and if it raises error, then we will
   * set the completed flag to true, along with the
   * error.
   */
  private async _runHook (fn: Hook<T>) {
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
     * Run all the tests in sequence, if any test sets the status
     * to completed, we will break the loop
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
      title: this._title,
      status: status,
      error: this._error,
    }
  }

  /**
   * Define timeout for all the tests inside the group. Still
   * each test can override it's own timeout.
   */
  public timeout (duration: number): this {
    ow(duration, ow.number.label('duration').integer)

    if (this._tests.length) {
      throw new Error('group.timeout must be called before defining the tests')
    }

    this._timeout = duration
    return this
  }

  /**
   * Create a new test as part of this group.
   */
  public test (title: string, callback: ICallback<T>, testOptions?: ITestOptions): Test<T> {
    ow(title, ow.string.label('title').nonEmpty)

    testOptions = Object.assign({
      skip: false,
      skipInCI: false,
      runInCI: false,
    }, testOptions)

    /**
     * Give priority to the group timeout vs the one defined
     * using runner properties
     */
    if (this._timeout) {
      testOptions.timeout = this._timeout
    }

    const test = new Test(title, this._resolveFn, callback, testOptions)

    this._tests.push(test)
    return test
  }

  /**
   * Add before hook to be executed before the group starts
   * executing tests.
   */
  public before (cb: ICallback<T>): this {
    ow(cb, ow.function.label('cb'))

    this._hooks.before.push(new Hook(this._resolveFn, cb))
    return this
  }

  /**
   * Add after hook to be executed after the group has executed
   * all the tests.
   */
  public after (cb: ICallback<T>): this {
    ow(cb, ow.function.label('cb'))

    this._hooks.after.push(new Hook(this._resolveFn, cb))
    return this
  }

  /**
   * Add before each hook to be execute before each test
   */
  public beforeEach (cb: ICallback<T>): this {
    ow(cb, ow.function.label('cb'))

    this._hooks.beforeEach.push(new Hook(this._resolveFn, cb))
    return this
  }

  /**
   * Add after each hook to be execute before each test
   */
  public afterEach (cb: ICallback<T>): this {
    ow(cb, ow.function.label('cb'))

    this._hooks.afterEach.push(new Hook(this._resolveFn, cb))
    return this
  }

  /**
   * Run the group with it's hooks and all tests.
   */
  public async run () {
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
