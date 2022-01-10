/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Hooks } from '@poppinss/hooks'

import { Suite } from '.'
import { Emitter } from '../Emitter'
import { SuiteEndNode, SuiteStartNode } from '../Contracts'

/**
 * Run all groups or tests inside the suite stack
 */
export class SuiteRunner {
  /**
   * Reference to the startup runner
   */
  private setupRunner = this.hooks.runner('setup')

  /**
   * Reference to the cleanup runner
   */
  private teardownRunner = this.hooks.runner('teardown')

  /**
   * Test errors
   */
  private errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[] = []

  /**
   * Track if test has any errors
   */
  private hasError: boolean = false

  constructor(private suite: Suite<any>, private hooks: Hooks, private emitter: Emitter) {}

  /**
   * Notify the reporter about the suite start
   */
  private notifyStart() {
    const startOptions: SuiteStartNode = { name: this.suite.name }
    this.emitter.emit('suite:start', startOptions)
  }

  /**
   * Notify the reporter about the suite end
   */
  private notifyEnd() {
    const endOptions: SuiteEndNode = {
      name: this.suite.name,
      hasError: this.hasError,
      errors: this.errors,
    }

    this.emitter.emit('suite:end', endOptions)
  }

  /**
   * Running setup hooks
   */
  private async runSetupHooks() {
    try {
      await this.setupRunner.run(this.suite)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'setup', error })
    }
  }

  /**
   * Running teardown hooks
   */
  private async runTeardownHooks() {
    try {
      await this.teardownRunner.run(this.suite)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'teardown', error })
    }
  }

  /**
   * Running setup cleanup functions
   */
  private async runSetupCleanupFunctions() {
    try {
      await this.setupRunner.cleanup(this.hasError, this.suite)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'setup:cleanup', error })
    }
  }

  /**
   * Running teardown cleanup functions
   */
  private async runTeardownCleanupFunctions() {
    try {
      await this.teardownRunner.cleanup(this.hasError, this.suite)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'teardown:cleanup', error })
    }
  }

  /**
   * Run the test
   */
  public async run() {
    this.notifyStart()

    /**
     * Run setup hooks and exit early when one of the hooks
     * fails
     */
    await this.runSetupHooks()
    if (this.hasError) {
      await this.runSetupCleanupFunctions()
      this.notifyEnd()
      return
    }

    /**
     * Run the test executor
     */
    for (let groupOrTest of this.suite.stack) {
      await groupOrTest.exec()
    }

    /**
     * Cleanup setup hooks
     */
    await this.runSetupCleanupFunctions()

    /**
     * Run + cleanup teardown hooks
     */
    await this.runTeardownHooks()
    await this.runTeardownCleanupFunctions()

    /**
     * Notify test end
     */
    this.notifyEnd()
  }
}
