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
import { Group } from './main.js'
import { Emitter } from '../emitter.js'
import type { GroupEndNode, GroupHooks, GroupHooksData, GroupStartNode } from '../types.js'

/**
 * Run all tests for a given group
 */
export class GroupRunner {
  /**
   * Parent group
   */
  #group: Group<any>

  /**
   * Emitter instance to notify reporters
   */
  #emitter: Emitter

  /**
   * Reference to the startup runner
   */
  #setupRunner: Runner<GroupHooksData<Record<any, any>>[0], GroupHooksData<Record<any, any>>[1]>

  /**
   * Reference to the cleanup runner
   */
  #teardownRunner: Runner<GroupHooksData<Record<any, any>>[0], GroupHooksData<Record<any, any>>[1]>

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

  constructor(group: Group<any>, hooks: Hooks<GroupHooks<Record<any, any>>>, emitter: Emitter) {
    this.#group = group
    this.#emitter = emitter
    this.#setupRunner = hooks.runner('setup')
    this.#teardownRunner = hooks.runner('teardown')
  }

  /**
   * Notify the reporter about the group start
   */
  #notifyStart() {
    const startOptions: GroupStartNode = { ...this.#group.options }
    this.#emitter.emit('group:start', startOptions)
  }

  /**
   * Notify the reporter about the group end
   */
  #notifyEnd() {
    const endOptions: GroupEndNode = {
      ...this.#group.options,
      hasError: this.#hasError,
      errors: this.#errors,
    }

    this.#emitter.emit('group:end', endOptions)
  }

  /**
   * Running setup hooks
   */
  async #runSetupHooks() {
    try {
      debug('running "%s" group setup hooks', this.#group.title)
      await this.#setupRunner.run(this.#group)
    } catch (error) {
      debug('group setup hooks failed, group: %s, error: %O', this.#group.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'setup', error })
    }
  }

  /**
   * Running teardown hooks
   */
  async #runTeardownHooks() {
    try {
      debug('running "%s" group teardown hooks', this.#group.title)
      await this.#teardownRunner.run(this.#group)
    } catch (error) {
      debug('group teardown hooks failed, group: %s, error: %O', this.#group.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'teardown', error })
    }
  }

  /**
   * Running setup cleanup functions
   */
  async #runSetupCleanupFunctions() {
    try {
      debug('running "%s" group setup cleanup functions', this.#group.title)
      await this.#setupRunner.cleanup(this.#hasError, this.#group)
    } catch (error) {
      debug('group setup cleanup function failed, group: %s, error: %O', this.#group.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'setup:cleanup', error })
    }
  }

  /**
   * Running teardown cleanup functions
   */
  async #runTeardownCleanupFunctions() {
    try {
      debug('running "%s" group teardown cleanup functions', this.#group.title)
      await this.#teardownRunner.cleanup(this.#hasError, this.#group)
    } catch (error) {
      debug(
        'group teardown cleanup function failed, group: %s, error: %O',
        this.#group.title,
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
    debug('starting to run "%s" group', this.#group.title)
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
    for (let test of this.#group.tests) {
      await test.exec()
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
