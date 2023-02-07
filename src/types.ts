/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Runner } from './runner'
import type { Test } from './test/main'
import type { Emitter } from './emitter'
import type { Group } from './group/main'
import type { Suite } from './suite/main'

/**
 * Shape of test data set. Should be an array of a function that
 * returns an array
 */
export type DataSetNode = undefined | any[] | (() => any[] | Promise<any[]>)

/**
 * The cleanup function for test hooks
 */
export type TestHooksCleanupHandler<Context extends Record<any, any>> = (
  error: null | any,
  test: Test<Context, any>
) => Promise<any> | any

/**
 * The function that can be registered as a test hook
 */
export type TestHooksHandler<Context extends Record<any, any>> = (
  test: Test<Context, any>
) =>
  | Promise<any>
  | any
  | TestHooksCleanupHandler<Context>
  | Promise<TestHooksCleanupHandler<Context>>

/**
 * The cleanup function for group hooks
 */
export type GroupHooksCleanupHandler<Context extends Record<any, any>> = (
  error: null | any,
  group: Group<Context>
) => Promise<any> | any

/**
 * The function that can be registered as a group hook
 */
export type GroupHooksHandler<Context extends Record<any, any>> = (
  group: Group<Context>
) =>
  | Promise<any>
  | any
  | GroupHooksCleanupHandler<Context>
  | Promise<GroupHooksCleanupHandler<Context>>

/**
 * The cleanup function for suite hooks
 */
export type SuiteHooksCleanupHandler<Context extends Record<any, any>> = (
  error: null | any,
  suite: Suite<Context>
) => Promise<any> | any

/**
 * The function that can be registered as a suite hook
 */
export type SuiteHooksHandler<Context extends Record<any, any>> = (
  suite: Suite<Context>
) =>
  | Promise<any>
  | any
  | SuiteHooksCleanupHandler<Context>
  | Promise<SuiteHooksCleanupHandler<Context>>

/**
 * The function to execute the test
 */
export type TestExecutor<Context, DataSet> = DataSet extends any[]
  ? (context: Context, value: DataSet[number], done: (error?: any) => void) => void | Promise<void>
  : DataSet extends () => infer A
  ? (
      context: Context,
      value: Awaited<A> extends any[] ? Awaited<A>[number] : Awaited<A>,
      done?: (error?: any) => void
    ) => void | Promise<void>
  : (context: Context, done: (error?: any) => void) => void | Promise<void>

/**
 * Test configuration options.
 */
export type TestOptions = {
  title: string
  tags: string[]
  timeout: number
  waitsForDone?: boolean
  executor?: TestExecutor<any, any>
  isTodo?: boolean
  isSkipped?: boolean
  isFailing?: boolean
  skipReason?: string
  failReason?: string
  retries?: number
  meta: Record<string, any>
}

/**
 * Data shared during "test:start" event
 */
export type TestStartNode = Omit<TestOptions, 'title'> & {
  title: {
    original: string
    expanded: string
    toString(): string
  }
  isPinned: boolean
  dataset?: {
    size: number
    index: number
    row: any
  }
}

/**
 * Data shared during "test:end" event
 */
export type TestEndNode = Omit<TestOptions, 'title'> & {
  title: {
    original: string
    expanded: string
    toString(): string
  }
  isPinned: boolean
  duration: number
  hasError: boolean
  errors: {
    phase: 'setup' | 'test' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup' | 'test:cleanup'
    error: Error
  }[]
  retryAttempt?: number
  dataset?: {
    size: number
    index: number
    row: any
  }
}

/**
 * Group options
 */
export type GroupOptions = {
  title: string
  meta: Record<string, any>
}

/**
 * Data shared with "group:start" event
 */
export type GroupStartNode = GroupOptions

/**
 * Data shared with "group:end" event
 */
export type GroupEndNode = GroupOptions & {
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[]
}

/**
 * Data shared with "suite:start" event
 */
export type SuiteStartNode = {
  name: string
}

/**
 * Data shared with "suite:end" event
 */
export type SuiteEndNode = {
  name: string
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[]
}

/**
 * Data shared with "runner:start" event
 */
export type RunnerStartNode = {}

/**
 * Data shared with "runner:end" event
 */
export type RunnerEndNode = {}

/**
 * Events emitted by the runner emitter. These can be extended as well
 */
export interface RunnerEvents {
  'test:start': TestStartNode
  'test:end': TestEndNode
  'group:start': GroupStartNode
  'group:end': GroupEndNode
  'suite:start': SuiteStartNode
  'suite:end': SuiteEndNode
  'runner:start': RunnerStartNode
  'runner:end': RunnerEndNode
  'uncaught:exception': Error
}

/**
 * Options for filtering and running on selected tests
 */
export type FilteringOptions = {
  tags?: string[]
  groups?: string[]
  tests?: string[]
}

/**
 * Type for the reporter handler function
 */
export type ReporterHandlerContract = (
  runner: Runner<any>,
  emitter: Emitter
) => void | Promise<void>

/**
 * Type for a named reporter object.
 */
export type NamedReporterContract = {
  readonly name: string
  handler: ReporterHandlerContract
}

/**
 * Test reporters must adhere to the following contract
 */
export type ReporterContract = ReporterHandlerContract | NamedReporterContract

/**
 * The test node inside the failure tree
 */
export type FailureTreeTestNode = {
  title: string
  type: 'test'
  errors: TestEndNode['errors']
}

/**
 * The group node inside the failure tree
 */
export type FailureTreeGroupNode = {
  name: string
  type: 'group'
  errors: GroupEndNode['errors']
  children: FailureTreeTestNode[]
}

/**
 * The suite node inside the failure tree
 */
export type FailureTreeSuiteNode = {
  name: string
  type: 'suite'
  errors: SuiteEndNode['errors']
  children: (FailureTreeTestNode | FailureTreeGroupNode)[]
}

/**
 * Runner summary properties
 */
export type RunnerSummary = {
  aggregates: {
    total: number
    failed: number
    passed: number
    regression: number
    skipped: number
    todo: number
    uncaughtExceptions: number
  }
  duration: number
  hasError: boolean
  failureTree: FailureTreeSuiteNode[]
  failedTestsTitles: string[]
}
