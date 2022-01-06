/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import retry from 'async-retry'
import { Hooks } from '@poppinss/hooks'
import timeSpan, { TimeEndFunction } from 'time-span'

import { Test } from '.'
import { Emitter } from '../Emitter'
import { DataSetNode, TestEndNode, TestStartNode } from '../Contracts'

/**
 * Dummy test runner that just emits the required events
 */
export class DummyRunner {
  constructor(private test: Test<DataSetNode>, private emitter: Emitter) {}

  /**
   * Notify the reporter about the test start
   */
  private notifyStart() {
    const startOptions: TestStartNode = { ...this.test.options }
    this.emitter.emit('test:start', startOptions)
  }

  /**
   * Notify the reporter about the test start
   */
  private notifyEnd() {
    const endOptions: TestEndNode = {
      ...this.test.options,
      hasError: false,
      duration: 0,
      errors: [],
    }

    this.emitter.emit('test:end', endOptions)
  }

  /**
   * Run test
   */
  public run() {
    this.notifyStart()
    this.notifyEnd()
  }
}

/**
 * Run an instance of test
 */
export class TestRunner {
  /**
   * The current retry attempt (exists only when retries are enabled)
   */
  private retryAttempt?: number

  /**
   * Time tracker to find test duration
   */
  private timeTracker: TimeEndFunction

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
    phase: 'setup' | 'test' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[] = []

  /**
   * Track if test has any errors
   */
  private hasError: boolean = false

  private uncaughtExceptionHandler?: NodeJS.UncaughtExceptionListener

  constructor(
    private test: Test<DataSetNode>,
    private hooks: Hooks,
    private emitter: Emitter,
    private datasetCurrentIndex?: number
  ) {}

  /**
   * Returns the dataset node for the test events
   */
  private getDatasetNode() {
    if (this.datasetCurrentIndex !== undefined && this.test.dataset) {
      return {
        dataset: {
          row: this.test.dataset[this.datasetCurrentIndex],
          index: this.datasetCurrentIndex,
          size: this.test.dataset.length,
        },
      }
    }
  }

  /**
   * Notify the reporter about the test start
   */
  private notifyStart() {
    this.timeTracker = timeSpan()
    const startOptions: TestStartNode = { ...this.test.options, ...this.getDatasetNode() }
    this.emitter.emit('test:start', startOptions)
  }

  /**
   * Notify the reporter about the test start
   */
  private notifyEnd() {
    const endOptions: TestEndNode = {
      ...this.test.options,
      ...this.getDatasetNode(),
      hasError: this.hasError,
      errors: this.errors,
      retryAttempt: this.retryAttempt,
      duration: this.timeTracker(),
    }

    this.emitter.emit('test:end', endOptions)
  }

  /**
   * Running setup hooks
   */
  private async runSetupHooks() {
    try {
      await this.setupRunner.run(this.test)
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
      await this.teardownRunner.run(this.test)
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
      await this.setupRunner.cleanup(this.errors.length > 0, this.test)
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
      await this.teardownRunner.cleanup(this.errors.length > 0, this.test)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'teardown:cleanup', error })
    }
  }

  /**
   * Run the test executor. The method takes care of passing
   * dataset row to the test method
   */
  private async runTest(done?: (error?: any) => void) {
    const datasetRow =
      this.datasetCurrentIndex !== undefined && this.test.dataset
        ? this.test.dataset[this.datasetCurrentIndex]
        : undefined

    return datasetRow !== undefined
      ? this.test.options.executor!(this.test.context, datasetRow, done)
      : this.test.options.executor!(this.test.context, done)
  }

  /**
   * Run the test executor that relies on the done method. The test will
   * timeout if done isn't called.
   */
  private runTestWithDone() {
    return new Promise<void>((resolve, reject) => {
      const done = (error?: any) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      /**
       * Done style tests the primary source of uncaught exceptions. Hence
       * we make an extra efforts to related uncaught exceptions with
       * them
       */
      if (!this.uncaughtExceptionHandler) {
        this.uncaughtExceptionHandler = (error) => {
          reject(error)
        }
        process.on('uncaughtException', this.uncaughtExceptionHandler)
      }

      this.runTest(done).catch(reject)
    })
  }

  /**
   * Run the test executor and make sure it times out after the configured
   * timeout.
   */
  private wrapTestInTimeout() {
    if (!this.test.options.timeout) {
      return this.test.options.waitsForDone ? this.runTestWithDone() : this.runTest()
    }

    const timeout = () => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), this.test.options.timeout)
      })
    }

    return Promise.race([
      this.test.options.waitsForDone ? this.runTestWithDone() : this.runTest(),
      timeout(),
    ])
  }

  /**
   * Runs the test with retries in place
   */
  private wrapTestInRetries() {
    if (!this.test.options.retries) {
      return this.wrapTestInTimeout()
    }

    return retry(
      (_: unknown, attempt: number) => {
        this.retryAttempt = attempt
        return this.wrapTestInTimeout()
      },
      { retries: this.test.options.retries, factor: 1 }
    )
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
    try {
      await this.wrapTestInRetries()
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'test', error })
    } finally {
      if (this.uncaughtExceptionHandler) {
        process.removeListener('uncaughtException', this.uncaughtExceptionHandler)
      }
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
