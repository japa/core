/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { inspect } from 'util'
import { Macroable } from 'macroable'

/**
 * A fresh copy of test context is shared with all the tests
 */
export class TestContext extends Macroable {
  public static macros = {}
  public static getters = {}

  public [inspect.custom]() {
    return inspect(this, { showHidden: false, depth: 1, colors: true, customInspect: false })
  }
}
