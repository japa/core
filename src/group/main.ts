/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Hooks from '@poppinss/hooks'
import Macroable from '@poppinss/macroable'

import debug from '../debug.js'
import { Test } from '../test/main.js'
import { Refiner } from '../refiner.js'
import { Emitter } from '../emitter.js'
import { GroupRunner } from './runner.js'
import type { GroupHooksHandler, TestHooksHandler, GroupOptions, GroupHooks } from '../types.js'

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
export class Group<Context extends Record<any, any>> extends Macroable {
  #emitter: Emitter
  #refiner: Refiner

  /**
   * Reference to registered hooks
   */
  #hooks = new Hooks<GroupHooks<Context>>()

  /**
   * Callbacks to invoke on each test
   */
  #tapsCallbacks: ((test: Test<Context, any>) => void)[] = []

  /**
   * Properties to configure on every test
   */
  #testsTimeout?: number
  #testsRetries?: number
  #testSetupHooks: TestHooksHandler<Context>[] = []
  #testTeardownHooks: TestHooksHandler<Context>[] = []

  options: GroupOptions

  /**
   * An array of tests registered under the given group
   */
  tests: Test<Context, any>[] = []

  /**
   * Shortcut methods to configure tests
   */
  each: {
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
      this.#testSetupHooks.push(handler)
    },

    /**
     * Define teardown hook for all tests inside the group
     */
    teardown: (handler: TestHooksHandler<Context>) => {
      this.#testTeardownHooks.push(handler)
    },

    /**
     * Define timeout for all tests inside the group
     */
    timeout: (timeout: number) => {
      this.#testsTimeout = timeout
    },

    /**
     * Disable timeout for all tests inside the group
     */
    disableTimeout: () => {
      this.#testsTimeout = 0
    },

    /**
     * Define retries for all tests inside the group
     */
    retry: (retries: number) => {
      this.#testsRetries = retries
    },
  }

  constructor(
    public title: string,
    emitter: Emitter,
    refiner: Refiner
  ) {
    super()
    this.#emitter = emitter
    this.#refiner = refiner
    this.options = {
      title: this.title,
      meta: {},
    }
  }

  /**
   * Add a test to the group. Adding a test to the group
   * mutates the test properties
   */
  add(test: Test<Context, any>): this {
    debug('adding "%s" test to "%s" group', test.title, this.title)

    /**
     * Bulk configure
     */
    if (this.#testsTimeout !== undefined) {
      test.timeout(this.#testsTimeout)
    }
    if (this.#testsRetries !== undefined) {
      test.retry(this.#testsRetries)
    }
    if (this.#testSetupHooks.length) {
      this.#testSetupHooks.forEach((handler) => test.setup(handler))
    }
    if (this.#testTeardownHooks.length) {
      this.#testTeardownHooks.forEach((handler) => test.teardown(handler))
    }

    /**
     * Invoke tap callback passing test to each callback
     */
    this.#tapsCallbacks.forEach((callback) => callback(test))

    this.tests.push(test)
    return this
  }

  /**
   * Tap into each test and configure it
   */
  tap(callback: (test: Test<Context, any>) => void): this {
    this.tests.forEach((test) => callback(test))
    this.#tapsCallbacks.push(callback)
    return this
  }

  /**
   * Define setup hook for the group
   */
  setup(handler: GroupHooksHandler<Context>): this {
    debug('registering "%s" group setup hook %s', this.title, handler)
    this.#hooks.add('setup', handler)
    return this
  }

  /**
   * Define teardown hook for the group
   */
  teardown(handler: GroupHooksHandler<Context>): this {
    debug('registering "%s" group teardown hook %s', this.title, handler)
    this.#hooks.add('teardown', handler)
    return this
  }

  /**
   * Execute group hooks and tests
   */
  async exec() {
    if (!this.#refiner.allows(this)) {
      debug('group skipped by refined %s', this.title)
      return
    }

    await new GroupRunner(this, this.#hooks, this.#emitter).run()
  }
}
