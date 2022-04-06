/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable } from 'macroable'
import { Hooks } from '@poppinss/hooks'

import { Refiner } from '../Refiner'
import { Emitter } from '../Emitter'
import { DummyRunner, TestRunner } from './Runner'
import { TestExecutor, TestOptions, TestHooksHandler, DataSetNode, TestEndNode } from '../Contracts'

/**
 * Test class exposes a self contained API to configure and run
 * tests along with its hooks.
 *
 * @example
 * const test = new Test('2 + 2 = 4', emitter, refiner)
 *
 * test.run(async ({ assert }) => {
 *   assert.equal(2 + 2 , 4)
 * })
 */
export class Test<
  Context extends Record<any, any>,
  TestData extends DataSetNode = undefined
> extends Macroable {
  public static macros = {}
  public static getters = {}

  /**
   * Methods to call before disposing the test
   */
  public static disposeCallbacks: ((
    test: Test<any, any>,
    hasError: boolean,
    errors: TestEndNode['errors']
  ) => void)[] = []

  /**
   * Find if the test has already been executed
   */
  private executed: boolean = false

  /**
   * Reference to registered hooks
   */
  private hooks = new Hooks()

  /**
   * Test options
   */
  public options: TestOptions = {
    title: this.title,
    tags: [],
    timeout: 2000,
    meta: {},
  }

  /**
   * Reference to the test dataset
   */
  public dataset?: any[]

  /**
   * Reference to the test context. Available at the time
   * of running the test
   */
  public context: Context

  /**
   * The function for creating the test context
   */
  private contextAccumlator?: (test: this) => Context | Promise<Context>

  /**
   * The function for computing if test should
   * be skipped or not
   */
  private skipAccumulator?: () => Promise<boolean> | boolean

  /**
   * The function that returns the test data set
   */
  private datasetAccumlator?: () => Promise<any[]> | any[]

  constructor(
    public title: string,
    context: Context | ((test: Test<Context, TestData>) => Context | Promise<Context>),
    private emitter: Emitter,
    private refiner: Refiner
  ) {
    super()

    /**
     * Make sure the instantiated class has its own property "disposeCalls"
     */
    if (!this.constructor.hasOwnProperty('disposeCallbacks')) {
      throw new Error(
        `Define static property "disposeCallbacks = []" on ${this.constructor.name} class`
      )
    }

    if (typeof context === 'function') {
      this.contextAccumlator = context as (
        test: Test<Context, TestData>
      ) => Context | Promise<Context>
    } else {
      this.context = context
    }
  }

  /**
   * Find if test should be skipped
   */
  private async computeShouldSkip() {
    if (this.skipAccumulator) {
      this.options.isSkipped = await this.skipAccumulator()
    }
  }

  /**
   * Find if test is a todo
   */
  private computeisTodo() {
    this.options.isTodo = !this.options.executor
  }

  /**
   * Returns the dataset array or undefined
   */
  private async computeDataset(): Promise<any[] | undefined> {
    if (typeof this.datasetAccumlator === 'function') {
      this.dataset = await this.datasetAccumlator()
    }

    return this.dataset
  }

  /**
   * Get context instance for the test
   */
  private async computeContext(): Promise<Context> {
    if (typeof this.contextAccumlator === 'function') {
      this.context = await this.contextAccumlator(this)
    }

    return this.context
  }

  /**
   * Skip the test conditionally
   */
  public skip(
    skip: boolean | (() => Promise<boolean> | boolean) = true,
    skipReason?: string
  ): this {
    if (typeof skip === 'function') {
      this.skipAccumulator = skip
    } else {
      this.options.isSkipped = skip
    }

    this.options.skipReason = skipReason
    return this
  }

  /**
   * Expect the test to fail. Helpful in creating test cases
   * to showcase bugs
   */
  public fails(failReason?: string): this {
    this.options.isFailing = true
    this.options.failReason = failReason
    return this
  }

  /**
   * Define custom timeout for the test
   */
  public timeout(timeout: number): this {
    this.options.timeout = timeout
    return this
  }

  /**
   * Disable test timeout. It is same as calling `test.timeout(0)`
   */
  public disableTimeout(): this {
    return this.timeout(0)
  }

  /**
   * Assign tags to the test. Later you can use the tags to run
   * specific tests
   */
  public tags(tags: string[], strategy: 'replace' | 'append' | 'prepend' = 'replace'): this {
    if (strategy === 'replace') {
      this.options.tags = tags
      return this
    }

    if (strategy === 'prepend') {
      this.options.tags = tags.concat(this.options.tags)
      return this
    }

    this.options.tags = this.options.tags.concat(tags)
    return this
  }

  /**
   * Configure the number of times this test should be retried
   * when failing.
   */
  public retry(retries: number): this {
    this.options.retries = retries
    return this
  }

  /**
   * Wait for the test executor to call done method
   */
  public waitForDone(): this {
    this.options.waitsForDone = true
    return this
  }

  /**
   * Pin current test. Pinning a test will only run the
   * pinned tests.
   */
  public pin(): this {
    this.refiner.pinTest(this)
    return this
  }

  /**
   * Define a dispose callback.
   *
   * Do note: Async methods are not allowed
   */
  public static dispose(
    callback: (test: Test<any, any>, hasError: boolean, errors: TestEndNode['errors']) => void
  ): void {
    this.disposeCallbacks.push(callback)
  }

  /**
   * Define the dataset for the test. The test executor will be invoked
   * for all the items inside the dataset array
   */
  public with<Dataset extends DataSetNode>(dataset: Dataset): Test<Context, Dataset> {
    if (Array.isArray(dataset)) {
      this.dataset = dataset
      return this as unknown as Test<Context, Dataset>
    }

    if (typeof dataset === 'function') {
      this.datasetAccumlator = dataset
      return this as unknown as Test<Context, Dataset>
    }

    throw new Error('dataset must be an array or a function that returns an array')
  }

  /**
   * Define the test executor function
   */
  public run(executor: TestExecutor<Context, TestData>): this {
    this.options.executor = executor
    return this
  }

  /**
   * Register a test setup function
   */
  public setup(handler: TestHooksHandler<Context>): this {
    this.hooks.add('setup', handler)
    return this
  }

  /**
   * Register a test teardown function
   */
  public teardown(handler: TestHooksHandler<Context>): this {
    this.hooks.add('teardown', handler)
    return this
  }

  /**
   * Execute test
   */
  public async exec() {
    /**
     * Return early, if there are pinned test and the current test is not
     * pinned.
     *
     * However, the pinned test check is only applied when there
     * is no filter on the test title.
     */
    if (!this.refiner.allows(this)) {
      return
    }

    /**
     * Avoid re-running the same test multiple times
     */
    if (this.executed) {
      return
    }

    this.executed = true

    /**
     * Do not run tests without executor function
     */
    this.computeisTodo()
    if (this.options.isTodo) {
      new DummyRunner(this, this.emitter).run()
      return
    }

    /**
     * Do not run test meant to be skipped
     */
    await this.computeShouldSkip()
    if (this.options.isSkipped) {
      new DummyRunner(this, this.emitter).run()
      return
    }

    /**
     * Run the test at least once with the first dataset, with or without any, and rerun for any additional datasets
     */
    await this.computeDataset()
    let index = 0
    do {
      await this.computeContext()
      await new TestRunner(
        this,
        this.hooks,
        this.emitter,
        (this.constructor as typeof Test).disposeCallbacks,
        index
      ).run()
    } while (++index < this.dataset!.length)
  }
}
