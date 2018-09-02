/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert } from 'chai'
import { Callable } from '../src/Callable'
import { TimeoutException } from '../src/Exceptions'
import { getFn, sleep } from './helpers'

describe('Callable', () => {
  it('should execute a function with given args', async () => {
    let username = ''
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args)

    await Callable(resolver, async (user) => {
      await sleep(100)
      username = user
    }, 2000)

    assert.equal(username, 'virk')
  })

  it('should execute a sync function', async () => {
    let username = ''
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args)

    await Callable(resolver, (user) => {
      username = user
    }, 2000)

    assert.equal(username, 'virk')
  })

  it('should execute a function and wait for done', async () => {
    let username = ''
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args)

    await Callable(resolver, (user, done) => {
      setTimeout(() => {
        username = user
        done()
      }, 100)
    }, 2000)

    assert.equal(username, 'virk')
  })

  it('should timeout test when over the given timeout', async () => {
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args)

    try {
      await Callable(resolver, (_user, done) => {
        setTimeout(() => {
          done()
        }, 300)
      }, 200)
      assert.isTrue(false)
    } catch (error) {
      assert.instanceOf(error, TimeoutException)
    }
  })

  it('should mark test as failed, when done contains an argument', async () => {
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args)

    try {
      await Callable(resolver, (_user, done) => {
        done(new Error('failed'))
      }, 2000)
      assert.isTrue(false)
    } catch ({ message }) {
      assert.equal(message, 'failed')
    }
  })

  it('should mark test as failed, when async has errors', async () => {
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args)

    try {
      await Callable(resolver, async () => {
        throw new Error('failed')
      }, 2000)
      assert.isTrue(false)
    } catch ({ message }) {
      assert.equal(message, 'failed')
    }
  })
})
