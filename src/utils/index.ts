/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import * as timeSpan from 'time-span'
import { IReport, IGroupReport, ITestReport, ITestStatus, IGroupStatus } from '../Contracts'
import * as exceptions from '../Exceptions'

export class TestsStore {
  private _store: IReport = {
    passedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    todoCount: 0,
    regressionCount: 0,
    total: 0,
    groups: [],
    duration: 0,
  }

  private _processStart: { rounded: Function }

  /**
   * Returns the currently active group
   */
  public get activeGroup () {
    return this._store.groups[this._store.groups.length - 1]
  }

  /**
   * Record the group
   */
  public recordGroup (group: IGroupReport) {
    this.open()
    this._store.groups.push({ title: group.title, failedTests: [], failedHooks: [] })
  }

  /**
   * End the group and record failed hooks
   */
  public endGroup (group: IGroupReport) {
    if (group.status === IGroupStatus.FAILED && this.activeGroup.title === group.title) {
      const error = group.error as any
      this.activeGroup.failedHooks.push({ title: error.fnName || error.lifecycle, error })
    }
  }

  /**
   * Record the test
   */
  public recordTest (test: ITestReport) {
    this.open()

    /**
     * Store reference to test and the group when test has been
     * failed
     */
    if (test.status === ITestStatus.FAILED) {
      this.activeGroup.failedTests.push({ title: test.title, error: test.error! })
    }

    /**
     * Increment the total counter
     */
    this._store.total++

    /**
     * Increment individual test statuses counters
     */
    switch (test.status) {
      case ITestStatus.FAILED:
        this._store.failedCount++
        break
      case ITestStatus.PASSED:
        this._store.passedCount++
        break
      case ITestStatus.SKIPPED:
        this._store.skippedCount++
        break
      case ITestStatus.TODO:
        this._store.todoCount++
        break
    }

    /**
     * Increment the regression counter
     */
    if (test.regression) {
      this._store.regressionCount++
    }
  }

  /**
   * Open store
   */
  public open () {
    if (!this._processStart) {
      this._processStart = timeSpan()
    }
  }

  /**
   * Close store
   */
  public close () {
    if (!this._store.duration) {
      this._store.duration = this._processStart.rounded()
    }
  }

  /**
   * Return store report
   */
  public getReport () {
    this.close()
    return this._store
  }
}

/**
 * Returns a boolean telling if exception is part of core exceptions or
 * not.
 */
export function isCoreException (error) : boolean {
  return !!Object.keys(exceptions).find((e) => error instanceof exceptions[e])
}
