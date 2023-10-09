/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import retry from 'async-retry'
import Hooks from '@poppinss/hooks'
import type { Runner } from '@poppinss/hooks/types'
import timeSpan, { TimeEndFunction } from 'time-span'

import debug from '../debug.js'
import { Test } from './main.js'
import { Emitter } from '../emitter.js'
import { interpolate } from '../interpolate.js'
import type { TestEndNode, TestHooks, TestHooksData, TestStartNode } from '../types.js'

/**
 * Dummy test runner that just emits the required events
 */
export class DummyRunner {
  #test: Test<any, any>
  #emitter: Emitter

  constructor(test: Test<any, any>, emitter: Emitter) {
    this.#test = test
    this.#emitter = emitter
  }

  /**
   * Notify the reporter about the test start
   */
  #notifyStart() {
    const startOptions: TestStartNode = {
      ...this.#test.options,
      title: {
        original: this.#test.options.title,
        expanded: this.#test.options.title,
        toString() {
          return this.original
        },
      },
      isPinned: this.#test.isPinned,
    }
    this.#emitter.emit('test:start', startOptions)
  }

  /**
   * Notify the reporter about the test start
   */
  #notifyEnd() {
    const endOptions: TestEndNode = {
      ...this.#test.options,
      title: {
        original: this.#test.options.title,
        expanded: this.#test.options.title,
        toString() {
          return this.original
        },
      },
      isPinned: this.#test.isPinned,
      hasError: false,
      duration: 0,
      errors: [],
    }

    this.#emitter.emit('test:end', endOptions)
  }

  /**
   * Run test
   */
  run() {
    this.#notifyStart()
    this.#notifyEnd()
  }
}

/**
 * Run an instance of test
 */
export class TestRunner {
  #emitter: Emitter

  /**
   * Timeout timer and promise reject method references to
   * fail the test after timeout. We keep global reference
   * to allow timeout reset within the test.
   */
  #timeout?: {
    timer: NodeJS.Timeout
    reject: (error: Error) => void
  }

  /**
   * Time tracker to find test duration
   */
  #timeTracker?: TimeEndFunction

  /**
   * Reference to the startup runner
   */
  #setupRunner: Runner<TestHooksData<Record<any, any>>[0], TestHooksData<Record<any, any>>[1]>

  /**
   * Reference to the cleanup runner
   */
  #teardownRunner: Runner<TestHooksData<Record<any, any>>[0], TestHooksData<Record<any, any>>[1]>

  /**
   * Test errors
   */
  #errors: TestEndNode['errors'] = []

  /**
   * Track if test has any errors
   */
  #hasError: boolean = false

  /**
   * Current dataset index for which executing the test
   */
  #datasetCurrentIndex: number | undefined

  /**
   * Callbacks to execute around the test executor
   */
  #callbacks: {
    executing: ((test: Test<any, any>) => void)[]
    executed: ((test: Test<any, any>, hasError: boolean, errors: TestEndNode['errors']) => void)[]
  }

  /**
   * Reference to parent test
   */
  #test: Test<any, any>

  /**
   * Need access to hooks so that we can grab an instance of
   * "cleanup" runner.
   *
   * The cleanup runner should be fetched post running the test callback,
   * since that callback can push hooks to the cleanup event.
   */
  #hooks: Hooks<TestHooks<Record<any, any>>>

  constructor(
    test: Test<any, any>,
    hooks: Hooks<TestHooks<Record<any, any>>>,
    emitter: Emitter,
    callbacks: {
      executing: ((test: Test<any, any>) => void)[]
      executed: ((test: Test<any, any>, hasError: boolean, errors: TestEndNode['errors']) => void)[]
    },
    datasetCurrentIndex?: number
  ) {
    this.#test = test
    this.#hooks = hooks
    this.#emitter = emitter
    this.#callbacks = callbacks
    this.#datasetCurrentIndex = datasetCurrentIndex
    this.#setupRunner = hooks.runner('setup')
    this.#teardownRunner = hooks.runner('teardown')
  }

  /**
   * Returns the dataset node for the test events
   */
  #getDatasetNode() {
    if (this.#datasetCurrentIndex !== undefined && this.#test.dataset) {
      return {
        dataset: {
          row: this.#test.dataset[this.#datasetCurrentIndex],
          index: this.#datasetCurrentIndex,
          size: this.#test.dataset.length,
        },
      }
    }
  }

  /**
   * Get the title node for the test
   */
  #getTitle(dataset?: { row: any; index: number }) {
    const title = this.#test.options.title

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
  #notifyStart() {
    this.#timeTracker = timeSpan()
    const dataset = this.#getDatasetNode()

    const startOptions: TestStartNode = {
      ...this.#test.options,
      ...dataset,
      isPinned: this.#test.isPinned,
      title: this.#getTitle(dataset ? dataset.dataset : undefined),
    }

    this.#emitter.emit('test:start', startOptions)
  }

  /**
   * Notify the reporter about the test start
   */
  #notifyEnd() {
    const dataset = this.#getDatasetNode()

    const endOptions: TestEndNode = {
      ...this.#test.options,
      ...dataset,
      isPinned: this.#test.isPinned,
      title: this.#getTitle(dataset ? dataset.dataset : undefined),
      hasError: this.#hasError,
      errors: this.#errors,
      retryAttempt: this.#test.options.retryAttempt,
      duration: this.#timeTracker?.() ?? 0,
    }

    this.#emitter.emit('test:end', endOptions)
  }

  /**
   * Running setup hooks
   */
  async #runSetupHooks() {
    try {
      debug('running "%s" test setup hooks', this.#test.title)
      await this.#setupRunner.run(this.#test)
    } catch (error) {
      debug('test setup hooks failed, test: %s, error: %O', this.#test.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'setup', error })
    }
  }

  /**
   * Running teardown hooks
   */
  async #runTeardownHooks() {
    try {
      debug('running "%s" test teardown hooks', this.#test.title)
      await this.#teardownRunner.run(this.#test)
    } catch (error) {
      debug('test teardown hooks failed, test: %s, error: %O', this.#test.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'teardown', error })
    }
  }

  /**
   * Running test cleanup functions
   */
  async #runTestCleanupFunctions() {
    const cleanupRunner = this.#hooks.runner('cleanup')
    this.#hooks.clear('cleanup')
    try {
      debug('running "%s" test cleanup functions', this.#test.title)
      await cleanupRunner.runReverse(this.#hasError, this.#test)
    } catch (error) {
      debug('test cleanup functions failed, test: %s, error: %O', this.#test.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'test:cleanup', error })
    }
  }

  /**
   * Running setup cleanup functions
   */
  async #runSetupCleanupFunctions() {
    try {
      debug('running "%s" test setup cleanup functions', this.#test.title)
      await this.#setupRunner.cleanup(this.#hasError, this.#test)
    } catch (error) {
      debug('test setup cleanup functions failed, test: %s, error: %O', this.#test.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'setup:cleanup', error })
    }
  }

  /**
   * Running teardown cleanup functions
   */
  async #runTeardownCleanupFunctions() {
    try {
      debug('running "%s" test teardown cleanup functions', this.#test.title)
      await this.#teardownRunner.cleanup(this.#hasError, this.#test)
    } catch (error) {
      debug('test teardown cleanup functions failed, test: %s, error: %O', this.#test.title, error)
      this.#hasError = true
      this.#errors.push({ phase: 'teardown:cleanup', error })
    }
  }

  /**
   * Run the test executor. The method takes care of passing
   * dataset row to the test method
   */
  async #runTest(done?: (error?: any) => void) {
    const datasetRow =
      this.#datasetCurrentIndex !== undefined && this.#test.dataset
        ? this.#test.dataset[this.#datasetCurrentIndex]
        : undefined

    return datasetRow !== undefined
      ? (this.#test.options.executor as any)(this.#test.context, datasetRow, done)
      : (this.#test.options.executor as any)(this.#test.context, done)
  }

  /**
   * Run the test executor that relies on the done method. The test will
   * timeout if done isn't called.
   */
  #runTestWithDone() {
    return new Promise<void>((resolve, reject) => {
      const done = (error?: any) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      }

      debug('running test "%s" and waiting for done method call', this.#test.title)
      this.#runTest(done).catch(reject)
    })
  }

  /**
   * Creates a timeout promise with global timer to reject
   * the promise after given duration.
   */
  #createTimeoutTimer(duration: number) {
    return new Promise((_, reject) => {
      debug('wrapping test in timeout timer')
      this.#timeout = {
        reject,
        timer: setTimeout(() => this.#timeout!.reject(new Error('Test timeout')), duration),
      }
    })
  }

  /**
   * Resets the timeout timer
   */
  #resetTimer(duration: number) {
    if (this.#timeout) {
      debug('resetting timer')
      clearTimeout(this.#timeout.timer)
      this.#timeout.timer = setTimeout(
        () => this.#timeout!.reject(new Error('Test timeout')),
        duration
      )
    }
  }

  /**
   * Clears the timer
   */
  #clearTimer() {
    if (this.#timeout) {
      debug('clearing timer')
      clearTimeout(this.#timeout.timer)
      this.#timeout = undefined
    }
  }

  /**
   * Run the test executor and make sure it times out after the configured
   * timeout.
   */
  async #wrapTestInTimeout() {
    if (!this.#test.options.timeout) {
      return this.#test.options.waitsForDone ? this.#runTestWithDone() : this.#runTest()
    }

    try {
      await Promise.race([
        this.#createTimeoutTimer(this.#test.options.timeout),
        this.#test.options.waitsForDone ? this.#runTestWithDone() : this.#runTest(),
      ])
    } finally {
      this.#clearTimer()
    }
  }

  /**
   * Runs the test with retries in place
   */
  #wrapTestInRetries() {
    if (!this.#test.options.retries) {
      return this.#wrapTestInTimeout()
    }

    return retry(
      (_: unknown, attempt: number) => {
        this.#test.options.retryAttempt = attempt
        return this.#wrapTestInTimeout()
      },
      { retries: this.#test.options.retries, factor: 1 }
    )
  }

  /**
   * Reset test timeout. The timeout will be removed, if
   * no duration value is provided
   */
  resetTimeout(duration?: number) {
    if (!duration) {
      this.#clearTimer()
    } else {
      this.#resetTimer(duration)
    }
  }

  /**
   * Run the test
   */
  async run() {
    debug('starting to run "%s" test', this.#test.title)
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
    try {
      this.#callbacks.executing.forEach((callback) => callback(this.#test))
      await this.#wrapTestInRetries()
    } catch (error) {
      this.#hasError = true
      this.#errors.push({ phase: 'test', error })
    }

    /**
     * Run dispose callbacks
     */
    this.#callbacks.executed.forEach((callback) => {
      try {
        callback(this.#test, this.#hasError, this.#errors)
      } catch (error) {
        this.#hasError = true
        this.#errors.push({ phase: 'test', error })
      }
    })

    /**
     * Run test cleanup hooks
     */
    await this.#runTestCleanupFunctions()

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
