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

import chalk from 'chalk'
import { EventEmitter } from 'events'

import { Test } from '../Test'
import { Group } from '../Group'
import { Loader } from './Loader'
import { Runner } from '../Runner'
import { Assert } from '../Assert'
import { emitter } from '../Emitter'
import listReporter from '../Reporter/list'
import { ICallback, IOptions, ITestOptions, IConfigureOptions } from '../Contracts'

const loader = new Loader()

/**
 * The type for the arguments to be passed to a
 * test
 */
type TestArgs = [Assert, Function]

/**
 * The type for the arguments to be passed to a
 * hook
 */
type HookArgs = [Function]

/**
 * Group instance exposed by slim runner
 */
type RunnerGroup = Pick<Group<TestArgs, HookArgs>, Exclude<keyof Group<TestArgs, HookArgs>, 'run' | 'toJSON' | 'test'>>

/**
 * Test instance exposed by slim runner
 */
type RunnerTest = Pick<Test<TestArgs>, Exclude<keyof Test<TestArgs>, 'run' | 'toJSON'>>

/**
 * Returns arguments to be passed to the callback
 * of a test
 */
function testArgsFn (done: Function, postRun: Function): TestArgs {
  postRun(function postRunFn (assert) {
    assert.evaluate()
  })
  return [new Assert(), done]
}

/**
 * Returns arguments to be passed to the callback of
 * a hook
 */
function hookArgsFn (done: Function): HookArgs {
  return [done]
}

/**
 * Store of groups
 */
let groups: Group<TestArgs, HookArgs>[] = []

/**
 * The active group, in which all tests must be scoped
 */
let activeGroup: Group<TestArgs, HookArgs> | null = null

/**
 * A flag to track, if `test.only` is used to cherry pick a
 * single test. All other tests are ignored from here
 * on.
 */
let cherryPickedTest = false

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
let reporterFn: ((emitter: EventEmitter) => void) = listReporter

/**
 * Reference to runner hooks, to be defined inside configure
 * method
 */
let beforeHooks: ((runner: Runner<TestArgs, HookArgs>, emitter: EventEmitter) => Promise<void>)[] = []
let afterHooks: ((runner: Runner<TestArgs, HookArgs>, emitter: EventEmitter) => Promise<void>)[] = []

/**
 * Adds the test to the active group. If there isn't any active
 * group, it will be created.
 */
function addTest (title: string, callback: ICallback<TestArgs>, options?: Partial<ITestOptions>): RunnerTest {
  if (!activeGroup) {
    activeGroup = new Group('root', testArgsFn, hookArgsFn, runnerOptions)
    groups.push(activeGroup)
  }

  return activeGroup.test(title, callback, options)
}

/**
 * Create a new test
 */
export function test (title: string, callback: ICallback<TestArgs>) {
  return addTest(title, callback)
}

/**
 * Run all the tests using the runner
 */
export async function run (exitProcess = true) {
  const runner = new Runner([] as Group<TestArgs, HookArgs>[], runnerOptions)
  runner.reporter(reporterFn)

  /**
   * Execute before hooks before loading any files
   * from the disk
   */
  for (let hook of beforeHooks) {
    await hook(runner, emitter)
  }

  const loaderFiles = await loader.loadFiles()
  if (loaderFiles.length && groups.length) {
    console.log(chalk.bgRed('Calling configure inside test file is not allowed. Create a master file for same'))
    process.exit(1)
  }

  /**
   * Load all files from the loader
   */
  loaderFiles.forEach((file) => {
    /**
     * Do not require more files, when cherry picking
     * tests
     */
    if (cherryPickedTest) {
      return
    }
    require(file)
  })

  let hardException = null

  try {
    await runner.useGroups(groups).run()
  } catch (error) {
    hardException = error
  }

  /**
   * Executing after hooks before cleanup
   */
  for (let hook of afterHooks) {
    await hook(runner, emitter)
  }

  if (exitProcess) {
    runner.hasErrors || hardException ? process.exit(1) : process.exit(0)
  }

  groups = []
  activeGroup = null
}

// eslint-disable-next-line no-redeclare
export namespace test {
  /**
   * Create a new test to group all test together
   */
  export function group (title: string, callback: (group: RunnerGroup) => void) {
    /**
     * Do not add new groups when already cherry picked a test
     */
    if (cherryPickedTest) {
      return
    }

    activeGroup = new Group(title, testArgsFn, hookArgsFn, runnerOptions)

    /**
     * Track the group
     */
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
   * Only run the specified test
   */
  export function only (title: string, callback: ICallback<TestArgs>) {
    const testInstance = addTest(title, callback, { only: true })

    /**
     * Empty out existing groups
     */
    groups = []

    /**
     * Push the current active group
     */
    groups.push(activeGroup!)

    /**
     * Turn on the flag
     */
    cherryPickedTest = true

    return testInstance
  }

  /**
   * Create a test, and mark it as skipped. Skipped functions are
   * never executed. However, their hooks are executed
   */
  export function skip (title: string, callback: ICallback<TestArgs>) {
    return addTest(title, callback, { skip: true })
  }

  /**
   * Create a test, and mark it as skipped only when running in CI. Skipped
   * functions are never executed. However, their hooks are executed.
   */
  export function skipInCI (title: string, callback: ICallback<TestArgs>) {
    return addTest(title, callback, { skipInCI: true })
  }

  /**
   * Create a test and run it only in the CI.
   */
  export function runInCI (title: string, callback: ICallback<TestArgs>) {
    return addTest(title, callback, { runInCI: true })
  }

  /**
   * Create regression test
   */
  export function failing (title: string, callback: ICallback<TestArgs>) {
    return addTest(title, callback, { regression: true })
  }

  /**
   * Configure test runner
   */
  export function configure (options: Partial<IConfigureOptions>) {
    /**
     * Reset runner options before every configure call
     */
    runnerOptions = {
      bail: false,
      timeout: 2000,
    }

    if (groups.length) {
      throw new Error('test.configure must be called before creating any tests')
    }

    /**
     * Hold repoter fn to be passed to the runner
     */
    if (options.reporterFn) {
      reporterFn = options.reporterFn
    }

    /**
     * Use bail option if defined by the end user
     */
    if (options.bail !== undefined) {
      runnerOptions.bail = options.bail
    }

    /**
     * Use timeout if defined by the end user
     */
    if (typeof (options.timeout) === 'number') {
      runnerOptions.timeout = options.timeout
    }

    /**
     * Use files glob if defined
     */
    if (options.files !== undefined) {
      loader.files(options.files)
    }

    /**
     * Use files filter if defined as function
     */
    if (typeof (options.filter) === 'function') {
      loader.filter(options.filter)
    }

    /**
     * Set after hooks
     */
    if (options.before) {
      if (!Array.isArray(options.before)) {
        throw new Error('"configure.before" expects an array of functions')
      }
      options.before.forEach((fn, index) => {
        if (typeof (fn) !== 'function') {
          throw new Error(`invalid value for "configure.before" at ${index} index`)
        }
      })

      beforeHooks = options.before
    }

    /**
     * Set before hooks
     */
    if (options.after) {
      if (!Array.isArray(options.after)) {
        throw new Error('"configure.after" expects an array of functions')
      }

      options.after.forEach((fn, index) => {
        if (typeof (fn) !== 'function') {
          throw new Error(`invalid value for "configure.after" at ${index} index`)
        }
      })

      afterHooks = options.after
    }

    /**
     * If grep is defined, then normalize it to regex
     */
    if (options.grep) {
      runnerOptions.grep = options.grep instanceof RegExp ? options.grep : new RegExp(options.grep)
    }
  }

  /**
   * Nested only
   */
  export namespace failing {
    /**
   * Only run the specified test
   */
    // eslint-disable-next-line @typescript-eslint/no-shadow
    export function only (title: string, callback: ICallback<TestArgs>) {
      runnerOptions.grep = new RegExp(title)
      return addTest(title, callback, { regression: true })
    }
  }
}
