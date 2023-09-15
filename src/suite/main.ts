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
import { Emitter } from '../emitter.js'
import { Refiner } from '../refiner.js'
import { Group } from '../group/main.js'
import { SuiteRunner } from './runner.js'
import type { SuiteHooks, SuiteHooksHandler } from '../types.js'

/**
 * The Suite class exposes the API to run a group of tests
 * or independent tests together as part of a suite.
 *
 * You can think of suites as
 *   - unit tests suite
 *   - e2e tests suites
 *   - and so on
 *
 * @example
 * const suite = new Suite('unit', emitter)
 * const group = new Group('addition', emitter, refiner)
 * const test = new Test('2 + 2 = 4', emitter, refiner)
 *
 * suite.add(group)
 * group.add(test)
 *
 * // Runs all the tests inside the registered group
 * await suite.exec()
 */
export class Suite<Context extends Record<any, any>> extends Macroable {
  #refiner: Refiner
  #emitter: Emitter

  /**
   * Reference to registered hooks
   */
  #hooks = new Hooks<SuiteHooks<Context>>()

  /**
   * Callbacks to invoke on each test and group
   */
  #configureTestCallbacks: ((test: Test<Context, any>) => void)[] = []
  #configureGroupCallbacks: ((group: Group<Context>) => void)[] = []

  /**
   * A collection of tests and groups both
   */
  stack: (Test<Context, any> | Group<Context>)[] = []

  constructor(
    public name: string,
    emitter: Emitter,
    refiner: Refiner
  ) {
    super()
    this.#emitter = emitter
    this.#refiner = refiner
  }

  /**
   * Add a test or a group to the execution stack
   */
  add(testOrGroup: Test<Context, any> | Group<Context>): this {
    if (testOrGroup instanceof Group) {
      this.#configureGroupCallbacks.forEach((callback) => callback(testOrGroup))
    }

    if (testOrGroup instanceof Test) {
      this.#configureTestCallbacks.forEach((callback) => callback(testOrGroup))
    }

    this.stack.push(testOrGroup)
    return this
  }

  /**
   * Tap into each test and configure it
   */
  onTest(callback: (test: Test<Context, any>) => void): this {
    this.#configureTestCallbacks.push(callback)
    return this
  }

  /**
   * Tap into each group and configure it
   */
  onGroup(callback: (group: Group<Context>) => void): this {
    this.#configureGroupCallbacks.push(callback)
    return this
  }

  /**
   * Register a test setup function
   */
  setup(handler: SuiteHooksHandler<Context>): this {
    debug('registering suite setup hook %s', handler)
    this.#hooks.add('setup', handler)
    return this
  }

  /**
   * Register a test teardown function
   */
  teardown(handler: SuiteHooksHandler<Context>): this {
    debug('registering suite teardown hook %s', handler)
    this.#hooks.add('teardown', handler)
    return this
  }

  /**
   * Execute suite groups, tests and hooks
   */
  async exec() {
    /**
     * By default a suite is not allowed to be executed. However, we go
     * through all the tests/ groups within the suite  and if one
     * or more tests/groups are allowed to run, then we will
     * allow the suite to run as well.
     *
     * Basically, we are checking the children to find if the suite
     * should run or not.
     */
    let allowSuite = false
    for (let item of this.stack) {
      allowSuite = this.#refiner.allows(item)
      if (allowSuite) {
        break
      }
    }

    if (!allowSuite) {
      debug('suite disabled by refiner %s', this.name)
      return
    }

    await new SuiteRunner(this, this.#hooks, this.#emitter).run()
  }
}
