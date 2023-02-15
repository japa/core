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

import { Test } from './main'
import { Emitter } from '../emitter'
import { interpolate } from '../interpolate'
import { TestEndNode, TestStartNode } from '../types'

/**
 * Dummy test runner that just emits the required events
 */
export class DummyRunner {
  constructor(private test: Test<any, any>, private emitter: Emitter) {}

  /**
   * Notify the reporter about the test start
   */
  private notifyStart() {
    const startOptions: TestStartNode = {
      ...this.test.options,
      title: {
        original: this.test.options.title,
        expanded: this.test.options.title,
        toString() {
          return this.original
        },
      },
      isPinned: this.test.isPinned,
    }
    this.emitter.emit('test:start', startOptions)
  }

  /**
   * Notify the reporter about the test start
   */
  private notifyEnd() {
    const endOptions: TestEndNode = {
      ...this.test.options,
      title: {
        original: this.test.options.title,
        expanded: this.test.options.title,
        toString() {
          return this.original
        },
      },
      isPinned: this.test.isPinned,
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
  private errors: TestEndNode['errors'] = []

  /**
   * Track if test has any errors
   */
  private hasError: boolean = false

  private uncaughtExceptionHandler?: NodeJS.UncaughtExceptionListener

  constructor(
    private test: Test<any, any>,
    private hooks: Hooks,
    private emitter: Emitter,
    private disposeCalls: ((
      test: Test<any, any>,
      hasError: boolean,
      errors: TestEndNode['errors']
    ) => void)[],
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
   * Get the title node for the test
   */
  private getTitle(dataset?: { row: any; index: number }) {
    const title = this.test.options.title

    return {
      original: title,
      expanded: dataset ? interpolate(title, dataset.row, dataset.index + 1) : title,
      toString() {
        return this.original
      },
    }
  }

  /**
   * Notify the reporter about the test start
   */
  private notifyStart() {
    this.timeTracker = timeSpan()
    const dataset = this.getDatasetNode()

    const startOptions: TestStartNode = {
      ...this.test.options,
      ...dataset,
      isPinned: this.test.isPinned,
      title: this.getTitle(dataset ? dataset.dataset : undefined),
    }

    this.emitter.emit('test:start', startOptions)
  }

  /**
   * Notify the reporter about the test start
   */
  private notifyEnd() {
    const dataset = this.getDatasetNode()

    const endOptions: TestEndNode = {
      ...this.test.options,
      ...dataset,
      isPinned: this.test.isPinned,
      title: this.getTitle(dataset ? dataset.dataset : undefined),
      hasError: this.hasError,
      errors: this.errors,
      retryAttempt: this.test.options.retryAttempt,
      duration: this.timeTracker.rounded(),
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
   * Running test cleanup functions
   */
  private async runTestCleanupFunctions() {
    try {
      await this.hooks.runner('cleanup').run(this.errors.length > 0, this.test)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'test:cleanup', error })
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
      ? (this.test.options.executor as any)(this.test.context, datasetRow, done)
      : (this.test.options.executor as any)(this.test.context, done)
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
  private async wrapTestInTimeout() {
    if (!this.test.options.timeout) {
      return this.test.options.waitsForDone ? this.runTestWithDone() : this.runTest()
    }

    let timeoutTimer: null | NodeJS.Timeout = null

    const timeout = () => {
      return new Promise((_, reject) => {
        timeoutTimer = setTimeout(
          () => reject(new Error('Test timeout')),
          this.test.options.timeout
        )
      })
    }

    try {
      await Promise.race([
        this.test.options.waitsForDone ? this.runTestWithDone() : this.runTest(),
        timeout(),
      ])
    } finally {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
      }
    }
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
        this.test.options.retryAttempt = attempt
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
     * Run dispose callbacks
     */
    try {
      this.disposeCalls.forEach((callback) => callback(this.test, this.hasError, this.errors))
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'test', error })
    }

    /**
     * Run test cleanup hooks
     */
    await this.runTestCleanupFunctions()

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
