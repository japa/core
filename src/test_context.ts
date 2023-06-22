/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { inspect } from 'node:util'
import Macroable from '@poppinss/macroable'

/**
 * A fresh copy of test context is shared with all the tests
 */
export class TestContext extends Macroable {
  [inspect.custom]() {
    return inspect(this, { showHidden: false, depth: 1, colors: true, customInspect: false })
  }
}
