/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Macroable } from 'macroable'

import { Suite } from '../Suite'
import { Emitter } from '../Emitter'
import { Tracker } from '../Tracker'
import { ReporterContract, RunnerSummary } from '../Contracts'

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
export class Runner<Context> extends Macroable {
  public static macros = {}
  public static getters = {}

  /**
   * Callbacks to invoke on every suite
   */
  private configureSuiteCallbacks: ((suite: Suite<Context>) => void)[] = []

  /**
   * Reference to tests tracker
   */
  private tracker: Tracker

  /**
   * Handler to listen for uncaughtException
   */
  private uncaughtExceptionHandler?: NodeJS.UncaughtExceptionListener

  /**
   * A collection of suites
   */
  public suites: Suite<Context>[] = []

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
    return this.emitter.emit('runner:start', {})
  }

  /**
   * Notify the reporter about the runner end
   */
  private notifyEnd() {
    return this.emitter.emit('runner:end', {})
  }

  /**
   * Boot the runner
   */
  private boot() {
    this.tracker = new Tracker()

    this.emitter.on('uncaught:exception', (payload) =>
      this.tracker.processEvent('uncaught:exception', payload)
    )
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
   * Add a suite to the runner
   */
  public add(suite: Suite<Context>): this {
    this.configureSuiteCallbacks.forEach((callback) => callback(suite))
    this.suites.push(suite)
    return this
  }

  /**
   * Tap into each suite and configure it
   */
  public onSuite(callback: (suite: Suite<Context>) => void): this {
    this.configureSuiteCallbacks.push(callback)
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
  public getSummary(): RunnerSummary {
    return this.tracker.getSummary()
  }

  /**
   * Start the test runner process. The method emits
   * "runner:start" event
   */
  public async start() {
    this.boot()

    for (let reporter of this.reporters) {
      await reporter(this, this.emitter)
    }

    await this.notifyStart()
  }

  /**
   * Execute runner suites
   */
  public async exec() {
    for (let suite of this.suites) {
      await suite.exec()
    }
  }

  /**
   * End the runner process. Emits "runner:end" event
   */
  public async end() {
    await this.notifyEnd()
  }
}
