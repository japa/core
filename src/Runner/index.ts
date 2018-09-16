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

/**
 * Runner class is used for defining global properties
 * and run all the tests inside the group.
 */
export class Runner <T extends any[], H extends any[]> {
  private _reporterFn: ((emitter, options) => void) | null

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
    this._reporterFn = fn
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
    }

    /**
     * Emit completed event
     */
    emitter.emit(IEvents.COMPLETED)
  }
}
