/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable } from 'macroable'
import { Hooks } from '@poppinss/hooks'

import { Test } from '../Test'
import { Emitter } from '../Emitter'
import { Refiner } from '../Refiner'
import { GroupRunner } from './Runner'
import { GroupHooksHandler, TestHooksHandler } from '../Contracts'

/**
 * Group class exposes an API to group multiple tests together
 * and bulk configure them.
 *
 * NOTE: Nested groups are not supported on purpose.
 *
 * @example
 * const group = new Group('addition', emitter, refiner)
 * const test = new Test('2 + 2 = 4', emitter, refiner)
 *
 * group.add(test)
 * await group.exec()
 */
export class Group<Context> extends Macroable {
  public static macros = {}
  public static getters = {}

  /**
   * Reference to registered hooks
   */
  private hooks = new Hooks()

  /**
   * Callbacks to invoke on each test
   */
  private tapsCallbacks: ((test: Test<Context, any>) => void)[] = []

  /**
   * Properties to configure on every test
   */
  private testsTimeout?: number
  private testsRetries?: number
  private testSetupHooks: TestHooksHandler<Context>[] = []
  private testTeardownHooks: TestHooksHandler<Context>[] = []

  /**
   * An array of tests registered under the given group
   */
  public tests: Test<Context, any>[] = []

  /**
   * Shortcut methods to configure tests
   */
  public each: {
    setup: (handler: TestHooksHandler<Context>) => void
    teardown: (handler: TestHooksHandler<Context>) => void
    timeout: (timeout: number) => void
    retry: (retries: number) => void
    disableTimeout: () => void
  } = {
    /**
     * Define setup hook for all tests inside the group
     */
    setup: (handler: TestHooksHandler<Context>) => {
      this.testSetupHooks.push(handler)
    },

    /**
     * Define teardown hook for all tests inside the group
     */
    teardown: (handler: TestHooksHandler<Context>) => {
      this.testTeardownHooks.push(handler)
    },

    /**
     * Define timeout for all tests inside the group
     */
    timeout: (timeout: number) => {
      this.testsTimeout = timeout
    },

    /**
     * Disable timeout for all tests inside the group
     */
    disableTimeout: () => {
      this.testsTimeout = 0
    },

    /**
     * Define retries for all tests inside the group
     */
    retry: (retries: number) => {
      this.testsRetries = retries
    },
  }

  constructor(public title: string, private emitter: Emitter, private refiner: Refiner) {
    super()
  }

  /**
   * Add a test to the group. Adding a test to the group
   * mutates the test properties
   */
  public add(test: Test<Context, any>): this {
    /**
     * Bulk configure
     */
    if (this.testsTimeout !== undefined) {
      test.timeout(this.testsTimeout)
    }
    if (this.testsRetries !== undefined) {
      test.retry(this.testsRetries)
    }
    if (this.testSetupHooks.length) {
      this.testSetupHooks.forEach((handler) => test.setup(handler))
    }
    if (this.testTeardownHooks.length) {
      this.testTeardownHooks.forEach((handler) => test.teardown(handler))
    }

    /**
     * Invoke tap callback passing test to each callback
     */
    this.tapsCallbacks.forEach((callback) => callback(test))

    this.tests.push(test)
    return this
  }

  /**
   * Tap into each test and configure it
   */
  public tap(callback: (test: Test<Context, any>) => void): this {
    this.tapsCallbacks.push(callback)
    return this
  }

  /**
   * Define setup hook for the group
   */
  public setup(handler: GroupHooksHandler<Context>): this {
    this.hooks.add('setup', handler)
    return this
  }

  /**
   * Define teardown hook for the group
   */
  public teardown(handler: GroupHooksHandler<Context>): this {
    this.hooks.add('teardown', handler)
    return this
  }

  /**
   * Execute group hooks and tests
   */
  public async exec() {
    if (!this.refiner.allows('group', this.title)) {
      return
    }

    await new GroupRunner(this, this.hooks, this.emitter).run()
  }
}
