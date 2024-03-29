/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Macroable from '@poppinss/macroable'

import debug from './debug.js'
import { Suite } from './suite/main.js'
import { Emitter } from './emitter.js'
import { Tracker } from './tracker.js'
import { ReporterContract, RunnerSummary } from './types.js'
import { SummaryBuilder } from './summary_builder.js'

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
export class Runner<Context extends Record<any, any>> extends Macroable {
  #emitter: Emitter

  /**
   * Callbacks to invoke on every suite
   */
  #configureSuiteCallbacks: ((suite: Suite<Context>) => void)[] = []

  /**
   * Reference to tests tracker
   */
  #tracker?: Tracker

  /**
   * Summary builder is used to create the tests summary reported by
   * multiple reporters. Each report contains a key-value pair
   */
  summaryBuilder = new SummaryBuilder()

  /**
   * A collection of suites
   */
  suites: Suite<Context>[] = []

  /**
   * Registered tests reporter
   */
  reporters: Set<ReporterContract> = new Set()

  constructor(emitter: Emitter) {
    super()
    this.#emitter = emitter
  }

  /**
   * Notify the reporter about the runner start
   */
  #notifyStart() {
    return this.#emitter.emit('runner:start', {})
  }

  /**
   * Notify the reporter about the runner end
   */
  #notifyEnd() {
    return this.#emitter.emit('runner:end', {})
  }

  /**
   * Boot the runner
   */
  #boot() {
    this.#tracker = new Tracker()

    this.#emitter.on('runner:start', (payload) =>
      this.#tracker?.processEvent('runner:start', payload)
    )
    this.#emitter.on('runner:end', (payload) => this.#tracker?.processEvent('runner:end', payload))
    this.#emitter.on('suite:start', (payload) =>
      this.#tracker?.processEvent('suite:start', payload)
    )
    this.#emitter.on('suite:end', (payload) => this.#tracker?.processEvent('suite:end', payload))
    this.#emitter.on('group:start', (payload) =>
      this.#tracker?.processEvent('group:start', payload)
    )
    this.#emitter.on('group:end', (payload) => this.#tracker?.processEvent('group:end', payload))
    this.#emitter.on('test:start', (payload) => this.#tracker?.processEvent('test:start', payload))
    this.#emitter.on('test:end', (payload) => this.#tracker?.processEvent('test:end', payload))
  }

  /**
   * Add a suite to the runner
   */
  add(suite: Suite<Context>): this {
    this.#configureSuiteCallbacks.forEach((callback) => callback(suite))
    this.suites.push(suite)
    debug('registering suite %s', suite.name)
    return this
  }

  /**
   * Tap into each suite and configure it
   */
  onSuite(callback: (suite: Suite<Context>) => void): this {
    this.suites.forEach((suite) => callback(suite))
    this.#configureSuiteCallbacks.push(callback)
    return this
  }

  /**
   * Register a tests reporter
   */
  registerReporter(reporter: ReporterContract): this {
    this.reporters.add(reporter)
    return this
  }

  /**
   * Get tests summary
   */
  getSummary(): RunnerSummary {
    return this.#tracker!.getSummary()
  }

  /**
   * Start the test runner process. The method emits
   * "runner:start" event
   */
  async start() {
    this.#boot()
    debug('starting to run tests')

    for (let reporter of this.reporters) {
      if (typeof reporter === 'function') {
        await reporter(this, this.#emitter)
      } else {
        await reporter.handler(this, this.#emitter)
      }
    }

    await this.#notifyStart()
  }

  /**
   * Execute runner suites
   */
  async exec() {
    for (let suite of this.suites) {
      await suite.exec()
    }
  }

  /**
   * End the runner process. Emits "runner:end" event
   */
  async end() {
    await this.#notifyEnd()
  }
}
