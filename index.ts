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

import { test, run } from './src/SlimRunner'

const nextTick = typeof (setImmediate) !== 'undefined' ? setImmediate : process.nextTick
nextTick(function cb () {
  run()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.log(error)
      process.exit(1)
    })
})

export = test
