/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import ow from 'ow'
import * as timeSpan from 'time-span'
import * as retry from 'retry'

import { Callable } from '../Callable'
import { emitter } from '../Emitter'
import { TimeoutException, RegressionException } from '../Exceptions'

import {
  ITestOptions,
  ITestReport,
  ITestStatus,
  IEvents,
  ICallback,
  IResolver,
} from '../Contracts'

export class Test <T extends any[]> {
  /**
   * When the callback for the function is not defined, then we mark
   * the test as todo
   */
  private _todo: boolean

  /**
   * Regression message is the one that passes, when it fails
   */
  private _regression: boolean

  /**
   * Regression message is the error message
   */
  private _regressionMessage: string = ''

  /**
   * The test timeout. It can be overridden at multiple levels
   */
  private _timeout: number

  /**
   * How many times, we should re-try the function before marking
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
   * Has test been executed
   */
  private _completed: boolean = false

  constructor (
    private _title: string,
    private _resolveFn: IResolver<T>,
    private _callback: ICallback<T> | undefined,
    options: ITestOptions,
  ) {
    this._todo = typeof (_callback) !== 'function'
    this._timeout = options.timeout
    this._regression = options.regression
  }

  /**
   * Returns a boolean, telling if exception is hard. Hard exceptions
   * fails the regression tests too
   */
  private get _isHardException () {
    return this._error instanceof TimeoutException || this._error instanceof RegressionException
  }

  /**
   * Runs test for given number retries
   */
  private _runTest () {
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
    } else if (this._completed && this._error) {
      status = (this._regression && !this._isHardException) ? ITestStatus.PASSED : ITestStatus.FAILED
    } else if (this._completed && !this._error) {
      status = ITestStatus.PASSED
    }

    return {
      title: this._title,
      status: status,
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
    ow(counts, ow.number.label('counts').integer)

    this._retries = counts
    return this
  }

  /**
   * Set explicit timeout for the given test.
   */
  public timeout (duration: number): this {
    ow(duration, ow.number.label('duration').integer)

    this._timeout = duration
    return this
  }

  /**
   * Runs the test along with it's before and after hooks
   * stack.
   *
   * If retries are defined, then the test will be retried for the
   * given number of times before marked as failed. When retrying
   * hooks are not executed again.
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
    if (!this._todo) {
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

    this._duration = start()
    this._completed = true
    emitter.emit(IEvents.TESTCOMPLETED, this.toJSON())
  }
}
