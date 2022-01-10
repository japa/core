/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Test } from '../Test'
import { Group } from '../Group'
import { Suite } from '../Suite'
import { Runner } from '../Runner'
import { Emitter } from '../Emitter'

/**
 * Shape of test data set. Should be an array of a function that
 * returns an array
 */
export type DataSetNode = undefined | any[] | (() => any[] | Promise<any[]>)

/**
 * The cleanup function for test hooks
 */
export type TestHooksCleanupHandler<Context> = (
  error: null | any,
  test: Test<Context, any>
) => Promise<any> | any

/**
 * The function that can be registered as a test hook
 */
export type TestHooksHandler<Context> = (
  test: Test<any, any>
) =>
  | Promise<any>
  | any
  | TestHooksCleanupHandler<Context>
  | Promise<TestHooksCleanupHandler<Context>>

/**
 * The cleanup function for group hooks
 */
export type GroupHooksCleanupHandler<Context> = (
  error: null | any,
  group: Group<Context>
) => Promise<any> | any

/**
 * The function that can be registered as a group hook
 */
export type GroupHooksHandler<Context> = (
  group: Group<Context>
) =>
  | Promise<any>
  | any
  | GroupHooksCleanupHandler<Context>
  | Promise<GroupHooksCleanupHandler<Context>>

/**
 * The cleanup function for suite hooks
 */
export type SuiteHooksCleanupHandler = (error: null | any, suite: Suite) => Promise<any> | any

/**
 * The function that can be registered as a suite hook
 */
export type SuiteHooksHandler = (
  suite: Suite
) => Promise<any> | any | SuiteHooksCleanupHandler | Promise<SuiteHooksCleanupHandler>

/**
 * The cleanup function for runner hooks
 */
export type RunnerHooksCleanupHandler = (error: null | any, runner: Runner) => Promise<any> | any

/**
 * The function that can be registered as a runner hook
 */
export type RunnerHooksHandler = (
  runner: Runner
) => Promise<any> | any | RunnerHooksCleanupHandler | Promise<RunnerHooksCleanupHandler>

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
}

/**
 * Data shared during "test:start" event
 */
export type TestStartNode = TestOptions & {
  dataset?: {
    size: number
    index: number
    row: any
  }
}

/**
 * Data shared during "test:end" event
 */
export type TestEndNode = TestOptions & {
  duration: number
  hasError: boolean
  errors: {
    phase: 'setup' | 'test' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
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
 * Data shared with "group:start" event
 */
export type GroupStartNode = {
  title: string
}

/**
 * Data shared with "group:end" event
 */
export type GroupEndNode = {
  title: string
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
export type RunnerEndNode = {
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[]
}

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
 * Test reporters must adhere to the following contract
 */
export interface ReporterContract {
  name: string
  open(runner: Runner, emitter: Emitter): void | Promise<void>
  close(): void | Promise<void>
}
