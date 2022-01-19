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

import { Suite } from '../Suite'
import { Emitter } from '../Emitter'
import { Tracker } from '../Tracker'
import { ReporterContract, RunnerEndNode, RunnerHooksHandler } from '../Contracts'

/**
 * The Runner class exposes the API to register test suites and execute
 * them sequentially.
 *
 * @example
 * const runner = new Runner(emitter)
 * const suite = new Suite('unit', emitter)
 *
 * runner.add(suite)
 * runner.registerReporter(reporters.list)
 *
 * await runner.exec()
 */
export class Runner extends Macroable {
  public static macros = {}
  public static getters = {}

  /**
   * Reference to registered hooks
   */
  private hooks = new Hooks()

  /**
   * Reference to tests tracker
   */
  private tracker: Tracker

  /**
   * Reference to the startup runner
   */
  private setupRunner: ReturnType<Hooks['runner']>

  /**
   * Reference to the cleanup runner
   */
  private teardownRunner: ReturnType<Hooks['runner']>

  /**
   * Test errors
   */
  private errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: Error
  }[]

  /**
   * Handler to listen for uncaughtException
   */
  private uncaughtExceptionHandler?: NodeJS.UncaughtExceptionListener

  /**
   * Track if test has any errors
   */
  private hasError: boolean = false

  /**
   * A collection of suites
   */
  public suites: Suite<any>[] = []

  /**
   * Registered tests reporter
   */
  public reporters: Set<ReporterContract> = new Set()

  constructor(private emitter: Emitter) {
    super()
  }

  /**
   * Notify the reporter about the runner start
   */
  private notifyStart() {
    this.emitter.emit('runner:start', {})
  }

  /**
   * Notify the reporter about the runner end
   */
  private notifyEnd() {
    const endOptions: RunnerEndNode = {
      hasError: this.hasError,
      errors: this.errors,
    }

    this.emitter.emit('runner:end', endOptions)
  }

  /**
   * Running setup hooks
   */
  private async runSetupHooks() {
    try {
      await this.setupRunner.run(this)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'setup', error })
    }
  }

  /**
   * Running teardown hooks
   */
  private async runTeardownHooks() {
    try {
      await this.teardownRunner.run(this)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'teardown', error })
    }
  }

  /**
   * Running setup cleanup functions
   */
  private async runSetupCleanupFunctions() {
    try {
      await this.setupRunner.cleanup(this.hasError, this)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'setup:cleanup', error })
    }
  }

  /**
   * Boot the runner
   */
  private boot() {
    this.setupRunner = this.hooks.runner('setup')
    this.teardownRunner = this.hooks.runner('teardown')
    this.tracker = new Tracker()
    this.errors = []
    this.hasError = false

    this.emitter.on('runner:start', (payload) => this.tracker.processEvent('runner:start', payload))
    this.emitter.on('runner:end', (payload) => this.tracker.processEvent('runner:end', payload))
    this.emitter.on('suite:start', (payload) => this.tracker.processEvent('suite:start', payload))
    this.emitter.on('suite:end', (payload) => this.tracker.processEvent('suite:end', payload))
    this.emitter.on('group:start', (payload) => this.tracker.processEvent('group:start', payload))
    this.emitter.on('group:end', (payload) => this.tracker.processEvent('group:end', payload))
    this.emitter.on('test:start', (payload) => this.tracker.processEvent('test:start', payload))
    this.emitter.on('test:end', (payload) => this.tracker.processEvent('test:end', payload))
  }

  /**
   * Running teardown cleanup functions
   */
  private async runTeardownCleanupFunctions() {
    try {
      await this.teardownRunner.cleanup(this.hasError, this)
    } catch (error) {
      this.hasError = true
      this.errors.push({ phase: 'teardown:cleanup', error })
    }
  }

  /**
   * Add a suite to the runner
   */
  public add(suite: Suite<any>): this {
    this.suites.push(suite)
    return this
  }

  /**
   * Register a tests reporter
   */
  public registerReporter(reporter: ReporterContract): this {
    this.reporters.add(reporter)
    return this
  }

  /**
   * Register a test setup function
   */
  public setup(handler: RunnerHooksHandler): this {
    this.hooks.add('setup', handler)
    return this
  }

  /**
   * Register a test teardown function
   */
  public teardown(handler: RunnerHooksHandler): this {
    this.hooks.add('teardown', handler)
    return this
  }

  /**
   * Manage unhandled exceptions occurred during tests
   */
  public manageUnHandledExceptions(): this {
    if (!this.uncaughtExceptionHandler) {
      this.uncaughtExceptionHandler = (error) => this.emitter.emit('uncaught:exception', error)
      process.on('uncaughtException', this.uncaughtExceptionHandler)
    }

    return this
  }

  /**
   * Get tests summary
   */
  public getSummary() {
    return this.tracker.getSummary()
  }

  /**
   * Execute runner suites
   */
  public async exec() {
    this.boot()

    for (let reporter of this.reporters) {
      await reporter.open(this, this.emitter)
    }

    this.notifyStart()

    /**
     * Run setup hooks and exit early when one of the hooks
     * fails
     */
    await this.runSetupHooks()
    if (this.hasError) {
      await this.runSetupCleanupFunctions()
      this.notifyEnd()
      return this.getSummary()
    }

    /**
     * Run the test executor
     */
    for (let suite of this.suites) {
      await suite.exec()
    }

    /**
     * Cleanup setup hooks
     */
    await this.runSetupCleanupFunctions()

    /**
     * Run + cleanup teardown hooks
     */
    await this.runTeardownHooks()
    await this.runTeardownCleanupFunctions()

    /**
     * Notify test end
     */
    this.notifyEnd()

    /**
     * Close reporters
     */
    for (let reporter of this.reporters) {
      await reporter.close(this)
    }

    return this.getSummary()
  }
}
