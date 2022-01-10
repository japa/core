/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Emitter } from '../src/Emitter'
import { RunnerEvents } from '../src/Contracts'

/**
 * Sleep for a while
 */
export function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

/**
 * Promisify an event
 */
export function pEvent<Name extends keyof RunnerEvents>(
  emitter: Emitter,
  event: Name,
  timeout: number = 500
) {
  return new Promise<RunnerEvents[Name] | null>((resolve) => {
    setTimeout(() => resolve(null), timeout)
    emitter.on(event, (data) => resolve(data))
  })
}
