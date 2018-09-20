/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IResolver, ITestOptions } from '../src/Contracts'

export function getFn <T extends any[]> (args: T, postRunCb?: Function): IResolver<T> {
  return function resolveFn (done: Function, postRun: Function): T & Function {
    if (typeof (postRunCb) === 'function') {
      postRun(postRunCb)
    }
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

export function getTestReporter () {
  const obj: {
    events: any[],
    fn: (emitter) => void,
  } = {
    events: [],
    fn (emitter) {
      emitter.on('test:started', (data) => {
        this.events.push({ event: 'test:started', data })
      })

      emitter.on('test:completed', (data) => {
        this.events.push({ event: 'test:completed', data })
      })

      emitter.on('group:started', (data) => {
        this.events.push({ event: 'group:started', data })
      })

      emitter.on('group:completed', (data) => {
        this.events.push({ event: 'group:completed', data })
      })
    },
  }

  return obj
}
