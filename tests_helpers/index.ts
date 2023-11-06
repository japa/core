/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Emitter } from '../src/emitter.js'
import { RunnerEvents } from '../src/types.js'

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
    function handler(data: RunnerEvents[Name]) {
      emitter.off(event, handler)
      resolve(data)
    }

    setTimeout(() => {
      emitter.off(event, handler)
      resolve(null)
    }, timeout)
    emitter.on(event, handler)
  })
}

/**
 * Promisify an event for multiple emit calls
 */
export function pEventTimes<Name extends keyof RunnerEvents>(
  emitter: Emitter,
  event: Name,
  times: number = 1,
  timeout: number = 500
) {
  return new Promise<RunnerEvents[Name][]>((resolve) => {
    let occurrences = 0
    let emittedData: RunnerEvents[Name][] = []

    function handler(data: RunnerEvents[Name]) {
      occurrences++
      emittedData.push(data)

      if (occurrences === times) {
        emitter.off(event, handler)
        resolve(emittedData)
      }
    }

    setTimeout(() => {
      emitter.off(event, handler)
      resolve([])
    }, timeout)

    emitter.on(event, handler)
  })
}
