/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import timeSpan, { TimeEndFunction } from 'time-span'
import type {
  TestEndNode,
  GroupEndNode,
  SuiteEndNode,
  RunnerEvents,
  RunnerSummary,
  GroupStartNode,
  SuiteStartNode,
  FailureTreeGroupNode,
  FailureTreeSuiteNode,
} from './types.js'

/**
 * Tracks the tests events to generate a summary report. Failing tests are further tracked
 * for complete hierarchy
 */
export class Tracker {
  /**
   * Time tracker to find runner duration
   */
  #timeTracker?: TimeEndFunction

  /**
   * Currently active suite
   */
  #currentSuite?: FailureTreeSuiteNode

  /**
   * Currently active group
   */
  #currentGroup?: FailureTreeGroupNode

  /**
   * If the entire run cycle has one or more errors
   */
  #hasError: boolean = false

  /**
   * Storing state if current suite and group has errors. These
   * errors are not directly from the suite and groups, but
   * instead from their children.
   *
   * For example: If a test fails, it marks both current group
   * and suite has errors.
   */
  #currentSuiteHasError = false
  #currentGroupHasError = false

  #aggregates: {
    total: number
    failed: number
    passed: number
    regression: number
    skipped: number
    todo: number
    uncaughtExceptions: number
  } = {
    total: 0,
    failed: 0,
    passed: 0,
    regression: 0,
    skipped: 0,
    todo: 0,
    uncaughtExceptions: 0,
  }

  #duration: number = 0

  /**
   * A tree of suites/groups and tests that have failed. They are always nested inside
   * other unless the test groups where used, then suites contains a list of tests
   * directly.
   */
  #failureTree: FailureTreeSuiteNode[] = []
  #failedTestsTitles: string[] = []

  /**
   * Set reference for the current suite
   */
  #onSuiteStart(payload: SuiteStartNode) {
    this.#currentSuiteHasError = false
    this.#currentSuite = {
      name: payload.name,
      type: 'suite',
      errors: [],
      children: [],
    }
  }

  /**
   * Move suite to the failure tree when the suite
   * has errors
   */
  #onSuiteEnd(payload: SuiteEndNode) {
    if (payload.hasError) {
      this.#hasError = true
      this.#currentSuiteHasError = true
      this.#currentSuite!.errors = payload.errors
    }

    if (this.#currentSuiteHasError) {
      this.#failureTree.push(this.#currentSuite!)
    }
  }

  /**
   * Set reference for the current group
   */
  #onGroupStart(payload: GroupStartNode) {
    this.#currentGroupHasError = false
    this.#currentGroup = {
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
  #onGroupEnd(payload: GroupEndNode) {
    if (payload.hasError) {
      this.#hasError = true
      this.#currentGroupHasError = true
      this.#currentGroup!.errors = payload.errors
    }

    if (this.#currentGroupHasError) {
      this.#currentSuiteHasError = true
      this.#currentSuite!.children.push(this.#currentGroup!)
    }
  }

  /**
   * In case of failure, track the test inside the current group
   * or the current suite.
   */
  #onTestEnd(payload: TestEndNode) {
    /**
     * Bumping aggregates
     */
    this.#aggregates.total++

    /**
     * Test was skipped
     */
    if (payload.isSkipped) {
      this.#aggregates.skipped++
      return
    }

    /**
     * Test was a todo
     */
    if (payload.isTodo) {
      this.#aggregates.todo++
      return
    }

    /**
     * Regression test. Mark test as failed, when there is no error
     * Because, we expect regression tests to have errors.
     *
     * However, there is no need to move anything to the failure
     * tree, since there is no real error
     */
    if (payload.isFailing) {
      if (!payload.hasError) {
        this.#aggregates.failed++
        this.#hasError = true
      } else {
        this.#aggregates.regression++
      }

      return
    }

    /**
     * Test completed successfully
     */
    if (!payload.hasError) {
      this.#aggregates.passed++
      return
    }

    this.#markTestAsFailed(payload)
  }

  /**
   * Mark test as failed
   */
  #markTestAsFailed(payload: TestEndNode) {
    /**
     * Bump failed count
     */
    this.#aggregates.failed++
    this.#hasError = true

    /**
     * Test payload
     */
    const testPayload = {
      type: 'test' as const,
      title: payload.title.expanded,
      errors: payload.errors,
    }

    /**
     * Track test inside the current group or suite
     */
    if (this.#currentGroup) {
      this.#currentGroupHasError = true
      this.#currentGroup.children.push(testPayload)
    } else if (this.#currentSuite) {
      this.#currentSuiteHasError = true
      this.#currentSuite.children.push(testPayload)
    }

    /**
     * Push title to the failedTestsTitles array
     */
    this.#failedTestsTitles.push(payload.title.original)
  }

  /**
   * Increment the count of uncaught exceptions
   */
  #onUncaughtException() {
    this.#aggregates.uncaughtExceptions++
    this.#hasError = true
  }

  /**
   * Process the tests events
   */
  processEvent<Event extends keyof RunnerEvents>(
    event: keyof RunnerEvents,
    payload: RunnerEvents[Event]
  ) {
    switch (event) {
      case 'uncaught:exception':
        this.#onUncaughtException()
        break
      case 'suite:start':
        this.#onSuiteStart(payload as SuiteStartNode)
        break
      case 'suite:end':
        this.#onSuiteEnd(payload as SuiteEndNode)
        break
      case 'group:start':
        this.#onGroupStart(payload as GroupStartNode)
        break
      case 'group:end':
        this.#onGroupEnd(payload as GroupEndNode)
        break
      case 'test:end':
        this.#onTestEnd(payload as TestEndNode)
        break
      case 'runner:start':
        this.#timeTracker = timeSpan()
        break
      case 'runner:end':
        this.#duration = this.#timeTracker?.rounded() ?? 0
        break
    }
  }

  /**
   * Returns the tests runner summary
   */
  getSummary(): RunnerSummary {
    return {
      aggregates: this.#aggregates,
      hasError: this.#hasError,
      duration: this.#duration,
      failureTree: this.#failureTree,
      failedTestsTitles: this.#failedTestsTitles,
    }
  }
}
