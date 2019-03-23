/**
 * @module Core
 */

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IOptions, IEvents } from '../Contracts'
import { Group } from '../Group'
import { emitter } from '../Emitter'
import ow from 'ow'

/**
 * Shape of hook function
 */
type IRunnerHook<T extends any[], H extends any[]> = (
  (runner: Runner<T, H>, emitter) => Promise<void>
)

/**
 * Runner class is used for defining global properties
 * and run all the tests inside the group.
 */
export class Runner <T extends any[], H extends any[]> {
  private _reporterFn: ((emitter, options) => void) | null
  private _hooks: {
    before: IRunnerHook<T, H>[],
    after: IRunnerHook<T, H>[],
  } = {
    before: [],
    after: [],
  }

  constructor (private _groups: Group<T, H>[], private _options: IOptions) {
  }

  /**
   * Returns a boolean telling if any of the groups or it's tests
   * has errors.
   */
  public get hasErrors (): boolean {
    return !!this._groups.find((group) => group.hasErrors)
  }

  /**
   * Define custom reporter
   */
  public reporter (fn: (emitter) => void): this {
    ow(fn, 'callback', ow.function)
    this._reporterFn = fn
    return this
  }

  /**
   * Define hooks to be executed before the runner starts
   * the tests
   */
  public before (fn: IRunnerHook<T, H>): this {
    ow(fn, 'callback', ow.function)
    this._hooks.before.push(fn)

    return this
  }

  /**
   * Define hooks to be executed after runner tests are over
   */
  public after (fn: IRunnerHook<T, H>): this {
    ow(fn, 'callback', ow.function)
    this._hooks.after.push(fn)

    return this
  }

  /**
   * Run all the tests inside the registered groups
   */
  public async run () {
    if (typeof (this._reporterFn) !== 'function') {
      throw new Error('Make sure to define tests reporter as a function')
    }

    /**
     * Execute before hooks
     */
    for (let hook of this._hooks.before) {
      await hook(this, emitter)
    }

    /**
     * Give emitter instance to the reporter
     */
    this._reporterFn(emitter, this._options)

    /**
     * Emit the started event
     */
    emitter.emit(IEvents.STARTED)

    /**
     * Run all the tests
     */
    for (let group of this._groups) {
      await group.run()

      /**
       * Break when bail is true and group has errors
       */
      if (this._options.bail && group.hasErrors) {
        break
      }
    }

    /**
     * Emit completed event
     */
    emitter.emit(IEvents.COMPLETED)

    /**
     * Execute after hooks
     */
    for (let hook of this._hooks.after) {
      await hook(this, emitter)
    }
  }
}
