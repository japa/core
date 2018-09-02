/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert as chaiAssert, use } from 'chai'

/**
 * The assert interface to run assertions using ChaiJs.
 *
 * @class Assert
 */
export class Assert {
  private _counts: number = 0
  private _plannedCounts: number = 0

  constructor () {
    return new Proxy(this, {
      get (target, name, receiver) {
        if (typeof (target[name]) !== 'undefined') {
          return Reflect.get(target, name, receiver)
        }

        /* istanbul ignore else */
        if (typeof (chaiAssert[name]) !== 'undefined') {
          target._counts++
        }

        return Reflect.get(chaiAssert, name, receiver)
      },
    })
  }

  /**
   * Use chai plugins
   */
  public static use (fn: (chai: any, utils: any) => void) {
    return use(fn)
  }

  /**
   * Plan for assertions
   */
  public plan (count: number) {
    this._plannedCounts = count
  }

  /**
   * Run all assertions
   */
  public evaluate () {
    if (this._plannedCounts && this._plannedCounts !== this._counts) {
      const suffix = this._plannedCounts === 1 ? '' : 's'
      chaiAssert.equal(
         this._plannedCounts,
         this._counts,
         `Planned for ${this._plannedCounts} assertion${suffix}, but ran ${this._counts}`,
      )
    }
  }
}
