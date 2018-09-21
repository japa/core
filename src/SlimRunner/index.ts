/**
 * @module SlimRunner
 */

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { Runner } from '../Runner'
import { Group } from '../Group'
import { Test } from '../Test'
import { Assert } from '../Assert'
import listReporter from '../Reporter/list'
import { ICallback, IOptions, ITestOptions, IConfigureOptions } from '../Contracts'
import { Loader } from './Loader'

const loader = new Loader()

/**
 * The type for the arguments to be passed to a
 * test
 */
type testArgs = [Assert, Function]

/**
 * The type for the arguments to be passed to a
 * hook
 */
type hookArgs = [Function]

/**
 * Group instance exposed by slim runner
 */
type runnerGroup = Pick<Group<testArgs, hookArgs>, Exclude<keyof Group<testArgs, hookArgs>, 'run' | 'toJSON' | 'test'>>

/**
 * Test instance exposed by slim runner
 */
type runnerTest = Pick<Test<testArgs>, Exclude<keyof Test<testArgs>, 'run' | 'toJSON'>>

/**
 * Returns arguments to be passed to the callback
 * of a test
 */
function testArgsFn (done: Function, postRun: Function): testArgs {
  postRun(function postRunFn (assert) {
    assert.evaluate()
  })
  return [new Assert(), done]
}

/**
 * Returns arguments to be passed to the callback of
 * a hook
 */
function hookArgsFn (done: Function): hookArgs {
  return [done]
}

/**
 * Store of groups
 */
let groups: Group<testArgs, hookArgs>[] = []

/**
 * The active group, in which all tests must be scoped
 */
let activeGroup: Group<testArgs, hookArgs> | null = null

/**
 * Options for the test runner
 */
let runnerOptions: IOptions = {
  bail: false,
  timeout: 2000,
}

/**
 * Custom reporter function
 */
let reporterFn: ((emitter) => void) = listReporter

/**
 * Adds the test to the active group. If there isn't any active
 * group, it will be created.
 */
function addTest (title: string, callback: ICallback<testArgs>, options?: Partial<ITestOptions>): runnerTest {
  if (!activeGroup) {
    activeGroup = new Group('root', testArgsFn, hookArgsFn, runnerOptions)
    groups.push(activeGroup)
  }

  return activeGroup.test(title, callback, options)
}

/**
 * Create a new test
 */
export function test (title: string, callback: ICallback<testArgs>) {
  return addTest(title, callback)
}

/**
 * Run all the tests using the runner
 */
export async function run () {
  const runner = new Runner(groups, runnerOptions)
  runner.reporter(reporterFn)

  const loaderFiles = await loader.loadFiles()
  if (loaderFiles.length && groups.length) {
    throw new Error('Calling test.configure inside test file is not allowed. Create a master file for same')
  }

  /**
   * Load all files from the loader
   */
  loaderFiles.forEach((file) => require(file))

  await runner.run()

  groups = []
  activeGroup = null
  runnerOptions = {
    bail: false,
    timeout: 2000,
  }
  reporterFn = listReporter
}

export namespace test {
  /**
   * Create a new test to group all test together
   */
  export function group (title: string, callback: (group: runnerGroup) => void) {
    activeGroup = new Group(title, testArgsFn, hookArgsFn, runnerOptions)
    groups.push(activeGroup)

    /**
     * Pass instance of the group to the callback. This enables defining lifecycle
     * hooks
     */
    callback(activeGroup)

    /**
     * Reset group after callback has been executed
     */
    activeGroup = null
  }

  /**
   * Create a test, and mark it as skipped. Skipped functions are
   * never executed. However, their hooks are executed
   */
  export function skip (title: string, callback: ICallback<testArgs>) {
    return addTest(title, callback, { skip: true })
  }

  /**
   * Create a test, and mark it as skipped only when running in CI. Skipped
   * functions are never executed. However, their hooks are executed.
   */
  export function skipInCI (title: string, callback: ICallback<testArgs>) {
    return addTest(title, callback, { skipInCI: true })
  }

  /**
   * Create a test and run it only in the CI.
   */
  export function runInCI (title: string, callback: ICallback<testArgs>) {
    return addTest(title, callback, { runInCI: true })
  }

  /**
   * Create regression test
   */
  export function failing (title: string, callback: ICallback<testArgs>) {
    return addTest(title, callback, { regression: true })
  }

  /**
   * Configure test runner
   */
  export function configure (options: Partial<IConfigureOptions>) {
    if (options.reporterFn) {
      reporterFn = options.reporterFn
    }

    if (options.bail !== undefined) {
      runnerOptions.bail = options.bail
    }

    if (typeof (options.timeout) === 'number') {
      runnerOptions.timeout = options.timeout
    }

    if (options.files !== undefined) {
      loader.files(options.files)
    }

    if (typeof (options.filter) === 'function') {
      loader.filter(options.filter)
    }
  }
}
