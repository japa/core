/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IOptions } from '../Contracts'
import { Group } from '../Group'
import { emitter } from '../Emitter'
import listReporter from '../Reporter/list'

export class Runner <T extends any[]> {
  private _reporterFn: ((emitter, options) => void) | null

  constructor (private _groups: Group<T>[], private _options: IOptions) {
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
    const reporterFn = typeof (this._reporterFn) === 'function' ? this._reporterFn : listReporter
    reporterFn(emitter, this._options)

    for (let group of this._groups) {
      await group.run()
    }
  }
}
