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

import { Callable } from '../Callable'
import { IResolver, ICallback } from '../Contracts'

/**
 * Hook class is used for running the group hooks.
 */
export class Hook <T extends any[]> {
  constructor (
    private _resolveFn: IResolver<T>,
    private _fn: ICallback<T>,
  ) {}

  /**
   * Run the hook. The hooks will raise errors and the parent test or
   * group should emit required events for them.
   */
  public async run () {
    await Callable(this._resolveFn, this._fn, 0)
  }
}
