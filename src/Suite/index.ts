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
import { Group } from '../Group'
import { Emitter } from '../Emitter'

import { SuiteRunner } from './Runner'
import { SuiteHooksHandler } from '../Contracts'

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
  public static macros = {}
  public static getters = {}

  /**
   * Reference to registered hooks
   */
  private hooks = new Hooks()

  /**
   * Callbacks to invoke on each test and group
   */
  private configureTestCallbacks: ((test: Test<Context, any>) => void)[] = []
  private configureGroupCallbacks: ((group: Group<Context>) => void)[] = []

  /**
   * A collection of tests and groups both
   */
  public stack: (Test<Context, any> | Group<Context>)[] = []

  constructor(public name: string, private emitter: Emitter) {
    super()
  }

  /**
   * Add a test or a group to the execution stack
   */
  public add(testOrGroup: Test<Context, any> | Group<Context>): this {
    if (testOrGroup instanceof Group) {
      this.configureGroupCallbacks.forEach((callback) => callback(testOrGroup))
    }

    if (testOrGroup instanceof Test) {
      this.configureTestCallbacks.forEach((callback) => callback(testOrGroup))
    }

    this.stack.push(testOrGroup)
    return this
  }

  /**
   * Tap into each test and configure it
   */
  public onTest(callback: (test: Test<Context, any>) => void): this {
    this.configureTestCallbacks.push(callback)
    return this
  }

  /**
   * Tap into each group and configure it
   */
  public onGroup(callback: (group: Group<Context>) => void): this {
    this.configureGroupCallbacks.push(callback)
    return this
  }

  /**
   * Register a test setup function
   */
  public setup(handler: SuiteHooksHandler<Context>): this {
    this.hooks.add('setup', handler)
    return this
  }

  /**
   * Register a test teardown function
   */
  public teardown(handler: SuiteHooksHandler<Context>): this {
    this.hooks.add('teardown', handler)
    return this
  }

  /**
   * Execute suite groups, tests and hooks
   */
  public async exec() {
    await new SuiteRunner(this, this.hooks, this.emitter).run()
  }
}
