/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Hooks from '@poppinss/hooks'
import { Runner } from '@poppinss/hooks/types'

import debug from '../debug.js'
import { Suite } from './main.js'
import { Emitter } from '../emitter.js'
import type { SuiteEndNode, SuiteHooks, SuiteHooksData, SuiteStartNode } from '../types.js'

/**
 * Run all groups or tests inside the suite stack
 */
export class SuiteRunner {
  #emitter: Emitter

  /**
   * Parent suite reference
   */
  #suite: Suite<any>

  /**
   * Reference to the startup runner
   */
  #setupRunner: Runner<SuiteHooksData<Record<any, any>>[0], SuiteHooksData<Record<any, any>>[1]>

  /**
   * Reference to the cleanup runner
   */
  #teardownRunner: Runner<SuiteHooksData<Record<any, any>>[0], SuiteHooksData<Record<any, any>>[1]>

  /**
   * Test errors
   */
  #errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[] = []

  /**
   * Track if test has any errors
   */
  #hasError: boolean = false

  constructor(suite: Suite<any>, hooks: Hooks<SuiteHooks<Record<any, any>>>, emitter: Emitter) {
    this.#suite = suite
    this.#emitter = emitter

    this.#setupRunner = hooks.runner('setup')
    this.#teardownRunner = hooks.runner('teardown')
  }

  /**
   * Notify the reporter about the suite start
   */
  #notifyStart() {
    const startOptions: SuiteStartNode = { name: this.#suite.name }
    this.#emitter.emit('suite:start', startOptions)
  }

  /**
   * Notify the reporter about the suite end
   */
  #notifyEnd() {
    const endOptions: SuiteEndNode = {
      name: this.#suite.name,
      hasError: this.#hasError,
      errors: this.#errors,
    }

    this.#emitter.emit('suite:end', endOptions)
  }

  /**
   * Running setup hooks
   */
  async #runSetupHooks() {
    debug('running "%s" suite setup hooks', this.#suite.name)
    try {
      await this.#setupRunner.run(this.#suite)
    } catch (error) {
      debug('suite setup hooks failed, suite: %s, error: %O', this.#suite.name, error)
      this.#hasError = true
      this.#errors.push({ phase: 'setup', error })
    }
  }

  /**
   * Running teardown hooks
   */
  async #runTeardownHooks() {
    debug('running "%s" suite teardown hooks', this.#suite.name)
    try {
      await this.#teardownRunner.run(this.#suite)
    } catch (error) {
      debug('suite teardown hooks failed, suite: %s, error: %O', this.#suite.name, error)
      this.#hasError = true
      this.#errors.push({ phase: 'teardown', error })
    }
  }

  /**
   * Running setup cleanup functions
   */
  async #runSetupCleanupFunctions() {
    debug('running "%s" suite setup cleanup functions', this.#suite.name)
    try {
      await this.#setupRunner.cleanup(this.#hasError, this.#suite)
    } catch (error) {
      debug('suite setup cleanup functions failed, suite: %s, error: %O', this.#suite.name, error)
      this.#hasError = true
      this.#errors.push({ phase: 'setup:cleanup', error })
    }
  }

  /**
   * Running teardown cleanup functions
   */
  async #runTeardownCleanupFunctions() {
    debug('running "%s" suite teardown cleanup functions', this.#suite.name)
    try {
      await this.#teardownRunner.cleanup(this.#hasError, this.#suite)
    } catch (error) {
      debug(
        'suite teardown cleanup functions failed, suite: %s, error: %O',
        this.#suite.name,
        error
      )
      this.#hasError = true
      this.#errors.push({ phase: 'teardown:cleanup', error })
    }
  }

  /**
   * Run the test
   */
  async run() {
    debug('starting to run "%s" suite', this.#suite.name)
    this.#notifyStart()

    /**
     * Run setup hooks and exit early when one of the hooks
     * fails
     */
    await this.#runSetupHooks()
    if (this.#hasError) {
      await this.#runSetupCleanupFunctions()
      this.#notifyEnd()
      return
    }

    /**
     * Run the test executor
     */
    for (let groupOrTest of this.#suite.stack) {
      await groupOrTest.exec()
    }

    /**
     * Cleanup setup hooks
     */
    await this.#runSetupCleanupFunctions()

    /**
     * Run + cleanup teardown hooks
     */
    await this.#runTeardownHooks()
    await this.#runTeardownCleanupFunctions()

    /**
     * Notify test end
     */
    this.#notifyEnd()
  }
}
