/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import timeSpan, { TimeEndFunction } from 'time-span'
import {
  TestEndNode,
  GroupEndNode,
  SuiteEndNode,
  RunnerEvents,
  RunnerEndNode,
  GroupStartNode,
  SuiteStartNode,
  FailureTreeGroupNode,
  FailureTreeSuiteNode,
} from '../Contracts'

/**
 * Tracks the tests events to generate a summary report. Failing tests are further tracked
 * for complete hierarchy
 */
export class Tracker {
  /**
   * Time tracker to find runner duration
   */
  private timeTracker: TimeEndFunction

  /**
   * Currently active suite
   */
  private currentSuite?: FailureTreeSuiteNode

  /**
   * Currently active group
   */
  private currentGroup?: FailureTreeGroupNode

  /**
   * If the entire run cycle has one or more errors
   */
  private hasError: boolean = false

  /**
   * Reference to the errors on the runner
   */
  private runnerErrors: RunnerEndNode['errors'] = []

  /**
   * Storing state if current suite and group has errors. These
   * errors are not directly from the suite and groups, but
   * instead from their children.
   *
   * For example: If a test fails, it marks both current group
   * and suite has errors.
   */
  private currentSuiteHasError = false
  private currentGroupHasError = false

  private aggregates: {
    total: number
    failed: number
    passed: number
    regression: number
    skipped: number
    todo: number
  } = {
    total: 0,
    failed: 0,
    passed: 0,
    regression: 0,
    skipped: 0,
    todo: 0,
  }

  private duration: number = 0

  /**
   * A tree of suites/groups and tests that have failed. They are always nested inside
   * other unless the test groups where used, then suites contains a list of tests
   * directly.
   */
  private failureTree: FailureTreeSuiteNode[] = []
  private failedTestsTitles: string[] = []

  /**
   * Set reference for the current suite
   */
  private onSuiteStart(payload: SuiteStartNode) {
    this.currentSuiteHasError = false
    this.currentSuite = {
      name: (payload as SuiteStartNode).name,
      type: 'suite',
      errors: [],
      children: [],
    }
  }

  /**
   * Move suite to the failure tree when the suite
   * has errors
   */
  private onSuiteEnd(payload: SuiteEndNode) {
    if (payload.hasError) {
      this.hasError = true
      this.currentSuiteHasError = true
      this.currentSuite!.errors = payload.errors
    }

    if (this.currentSuiteHasError) {
      this.failureTree.push(this.currentSuite!)
    }
  }

  /**
   * Set reference for the current group
   */
  private onGroupStart(payload: GroupStartNode) {
    this.currentGroupHasError = false
    this.currentGroup = {
      name: payload.title,
      type: 'group',
      errors: [],
      children: [],
    }
  }

  /**
   * Move suite to the failure tree when the suite
   * has errors
   */
  private onGroupEnd(payload: GroupEndNode) {
    if (payload.hasError) {
      this.hasError = true
      this.currentGroupHasError = true
      this.currentGroup!.errors = payload.errors
    }

    if (this.currentGroupHasError) {
      this.currentSuiteHasError = true
      this.currentSuite!.children.push(this.currentGroup!)
    }
  }

  /**
   * Move suite to the failure tree when the suite
   * has errors
   */
  private onRunnerEnd(payload: RunnerEndNode) {
    if (payload.hasError) {
      this.hasError = true
      this.runnerErrors = payload.errors
    }
  }

  /**
   * In case of failure, track the test inside the current group
   * or the current suite.
   */
  private onTestEnd(payload: TestEndNode) {
    /**
     * Bumping aggregates
     */
    this.aggregates.total++

    if (payload.isSkipped) {
      this.aggregates.skipped++
      return
    }

    if (payload.isTodo) {
      this.aggregates.todo++
      return
    }

    /**
     * Test completed successfully
     */
    if (!payload.hasError) {
      this.aggregates.passed++
      return
    }

    /**
     * Test has error, but is regression test
     */
    if (payload.hasError && payload.isFailing) {
      this.aggregates.regression++
      return
    }

    /**
     * Bump failed count
     */
    this.aggregates.failed++
    this.hasError = true

    /**
     * Test payload
     */
    const testPayload = {
      type: 'test' as const,
      title: payload.title,
      errors: payload.errors,
    }

    /**
     * Track test inside the current group or suite
     */
    if (this.currentGroup) {
      this.currentGroupHasError = true
      this.currentGroup.children.push(testPayload)
    } else if (this.currentSuite) {
      this.currentSuiteHasError = true
      this.currentSuite.children.push(testPayload)
    }

    /**
     * Push title to the failedTestsTitles array
     */
    this.failedTestsTitles.push(payload.title)
  }

  /**
   * Process the tests events
   */
  public processEvent<Event extends keyof RunnerEvents>(
    event: keyof RunnerEvents,
    payload: RunnerEvents[Event]
  ) {
    switch (event) {
      case 'suite:start':
        this.onSuiteStart(payload as SuiteStartNode)
        break
      case 'suite:end':
        this.onSuiteEnd(payload as SuiteEndNode)
        break
      case 'group:start':
        this.onGroupStart(payload as GroupStartNode)
        break
      case 'group:end':
        this.onGroupEnd(payload as GroupEndNode)
        break
      case 'test:end':
        this.onTestEnd(payload as TestEndNode)
        break
      case 'runner:start':
        this.timeTracker = timeSpan()
        break
      case 'runner:end':
        this.onRunnerEnd(payload as RunnerEndNode)
        this.duration = this.timeTracker.rounded()
        break
    }
  }

  /**
   * Returns the tests runner summary
   */
  public getSummary() {
    return {
      ...this.aggregates,
      hasError: this.hasError,
      runnerErrors: this.runnerErrors,
      duration: this.duration,
      failureTree: this.failureTree,
      failedTestsTitles: this.failedTestsTitles,
    }
  }
}
