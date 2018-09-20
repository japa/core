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

import { TimeoutException } from '../Exceptions'
import { IResolver, ICallback } from '../Contracts'
import * as Debug from 'debug'

/**
 * @ignore
 */
const debug = Debug('japa')

/**
 * Executes the function as promise
 * @ignore
 */
async function asPromise (fn, args) {
  return await fn(...args)
}

/**
 * Calls a function and tracks it's completion in multiple ways. If original function
 * relies on `done`, then it will wait for `done` to be called. Also if timeout is
 * defined, the function will fail if doesn't return before the timeout.
 */
export function Callable <T extends any[]> (resolveFn: IResolver<T>, callback: ICallback<T>, timeout: number) {
  return new Promise((resolve, reject) => {
    let postCallable: null | Function = null
    const args: T = resolveFn(done, function postRun (fn) {
      postCallable = fn
    })

    /**
     * Finding if we need to wait for done to be called
     */
    const needsDone: boolean = args.length === callback.length
    debug('needsDone %s', needsDone)

    /**
     * Is callable completed?
     */
    let completed: boolean = false

    /**
     * Timer to timeout the test, if timeout is defined
     */
    let timer: NodeJS.Timer | null = null

    /**
     * Clears the timer if it exists
     */
    function clearTimer () {
      if (timer) {
        debug('clearing timer')
        clearTimeout(timer)
      }
    }

    /**
     * Finish the callable
     */
    function finish (error?) {
      if (typeof (postCallable) === 'function' && !error) {
        try {
          postCallable(...args)
        } catch (postCallableError) {
          error = postCallableError
        }
      }

      debug(error ? 'finishing callable as error' : 'finishing callable')

      completed = true
      clearTimer()

      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }

    /**
     * Done is passed to fn to mark them as completed. When `done`
     * is used, we need wait for it to be called or timeout.
     */
    function done (error) {
      if (completed) {
        return
      }

      if (error) {
        finish(error)
        return
      }

      finish()
    }

    /**
     * Only set the timer, when timeout is over 0
     */
    if (timeout > 0) {
      debug('creating timer')
      timer = setTimeout(() => {
        debug('timeout')

        /* istanbul ignore else */
        if (!completed) {
          finish(new TimeoutException(`Test timeout after ${timeout} milliseconds`))
        }
      }, timeout)
    }

    debug('executing callable')
    asPromise(callback, args)
      .then(() => {
        if (!needsDone) {
          finish()
        }
      })
      .catch((error) => {
        finish(error)
      })
  })
}
