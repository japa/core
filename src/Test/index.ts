/**
 * @module Core
 */

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import isCI from 'is-ci'
import retry from 'retry'
import timeSpan from 'time-span'

import { emitter } from '../Emitter'
import { Callable } from '../Callable'
import { isCoreException } from '../utils'
import { RegressionException } from '../Exceptions'

import {
  ITestOptions,
  ITestReport,
  ITestStatus,
  IEvents,
  ICallback,
  IResolver,
} from '../Contracts'

/**
 * Test class is used for running and defining a test. It supports following
 * top level config properties.
 *
 * - skip     : Skip the test
 * - skipInCI : Skip the test on CI
 * - runInCI  : Run only in CI
 */
export class Test <T extends any[]> {
  /**
   * When the callback for the function is not defined, then we mark
   * the test as todo
   */
  private _todo: boolean

  /**
   * Mark failed tests as passed
   */
  private _regression: boolean

  /**
   * Regression message is set when the passes, but it was meant
   * to fail
   */
  private _regressionMessage: string = ''

  /**
   * The test timeout. It can be overridden at multiple levels
   */
  private _timeout: number

  /**
   * How many times, we should retry the function before marking
   * it as failed
   */
  private _retries: number = 0

  /**
   * The time spent to run the test. This includes the hooks
   * time.
   */
  private _duration: number = 0

  /**
   * The test error (if any)
   */
  private _error: Error | null = null

  /**
   * Whether or not to skip the test
   */
  private _skip: boolean

  /**
   * Has test been executed
   */
  private _completed: boolean = false

  constructor (
    public title: string,
    private _resolveFn: IResolver<T>,
    private _callback: ICallback<T> | undefined,
    options: ITestOptions,
  ) {
    this._todo = typeof (this._callback) !== 'function'
    this._timeout = options.timeout
    this._regression = options.regression

    if (options.skip) {
      this._skip = true
    } else if (options.skipInCI && isCI) {
      this._skip = true
    } else if (options.runInCI && !isCI) {
      this._skip = true
    }
  }

  /**
   * Returns a boolean, telling if exception is hard. Hard exceptions
   * fails the regression tests too
   */
  private get _isHardException () {
    return isCoreException(this._error)
  }

  /**
   * Runs test for given number retries
   */
  private _runTest (): Promise<void> {
    return new Promise((resolve, reject) => {
      const op = retry.operation({ retries: this._retries, factor: 1 })

      op.attempt(async () => {
        Callable(this._resolveFn, this._callback!, this._timeout)
          .then(resolve)
          .catch((error) => {
            if (op.retry(error)) {
              return
            }
            reject(op.mainError())
          })
      })
    })
  }

  /**
   * The JSON representation of the test. This is emitted
   * as an event to show test state.
   */
  public toJSON (): ITestReport {
    let status = ITestStatus.PENDING

    if (this._todo) {
      status = ITestStatus.TODO
    } else if (this._skip) {
      status = ITestStatus.SKIPPED
    } else if (this._completed && this._error) {
      status = (this._regression && !this._isHardException) ? ITestStatus.PASSED : ITestStatus.FAILED
    } else if (this._completed && !this._error) {
      status = ITestStatus.PASSED
    }

    return {
      title: this.title,
      status: status,
      regression: this._regression,
      regressionMessage: this._regressionMessage,
      duration: this._duration,
      error: this._error,
    }
  }

  /**
   * Retry a test for the given number of counts, before marking
   * it as failed.
   */
  public retry (counts: number): this {
    if (typeof (counts) !== 'number') {
      throw new Error('"test.retry" expects a number value')
    }

    this._retries = counts
    return this
  }

  /**
   * Set explicit timeout for the given test.
   */
  public timeout (duration: number): this {
    if (typeof (duration) !== 'number') {
      throw new Error('"test.timeout" expects a number value')
    }

    this._timeout = duration
    return this
  }

  /**
   * Runs the test. If retries are defined, then the test will be retried for the
   * given number of times before marked as failed. When retrying hooks are not
   * executed again.
   *
   * ```js
   * // stack
   * [before hook 1, before hook 2]
   * [test] (2 retries)
   * [after hook 1]
   *
   * + before hook 1
   * + before hook 2
   *   test (original attempt = failed)
   *   test (1st attempt = passed)
   * + after hook 1
   * ```
   */
  public async run () {
    emitter.emit(IEvents.TESTSTARTED, this.toJSON())
    const start = timeSpan()

    /* istanbul ignore else */
    if (!this._todo && !this._skip) {
      /**
       * Run the actual test
       */
      try {
        await this._runTest()

        /**
         * Mark test as failed, when is regression but passed
         */
        if (this._regression) {
          throw new RegressionException('Expected regression test to fail')
        }
      } catch (error) {
        this._error = error
        if (!this._isHardException && this._regression) {
          this._regressionMessage = error.message
        }
      }
    }

    this._duration = start.rounded()
    this._completed = true
    emitter.emit(IEvents.TESTCOMPLETED, this.toJSON())
  }
}
