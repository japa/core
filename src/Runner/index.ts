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
export class Runner extends Macroable {
  public static macros = {}
  public static getters = {}

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
    this.emitter.emit('runner:end', {})
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
   * Execute runner suites
   */
  public async exec() {
    this.boot()

    for (let reporter of this.reporters) {
      await reporter(this, this.emitter)
    }

    /**
     * Notify runner start
     */
    this.notifyStart()

    /**
     * Run the test executor
     */
    for (let suite of this.suites) {
      await suite.exec()
    }

    /**
     * Wait for the nodejs event loop to get empty before
     * notifying the runner end.
     *
     * We only care about the event loop when the uncaught
     * exceptions are managed by the runner
     */
    if (this.uncaughtExceptionHandler) {
      return new Promise((resolve) => {
        function beforeExit() {
          process.removeListener('beforeExit', beforeExit)
          this.notifyEnd()
          resolve(this.getSummary())
        }

        process.on('beforeExit', beforeExit)
      })
    }

    /**
     * Notify runner end
     */
    this.notifyEnd()

    return this.getSummary()
  }
}
