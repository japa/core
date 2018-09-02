/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IResolver, ITestOptions } from '../src/Contracts'

export function getFn <T extends any[]> (args: T): IResolver<T> {
  return function resolveFn (done: Function): T & Function {
    return <T & Function> args.concat(done)
  }
}

export function sleep (timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

export function testOptions (options?): ITestOptions {
  return Object.assign({
    regression: false,
    timeout: 2000,
  }, options)
}
