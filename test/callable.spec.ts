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

  it('should mark test as failed, when post run ends with error', async () => {
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args, function cb () {
      throw new Error('Failed in post run')
    })

    try {
      await Callable(resolver, () => {
      }, 2000)
      assert.isTrue(false)
    } catch ({ message }) {
      assert.equal(message, 'Failed in post run')
    }
  })

  it('should mark test as failed, when post run ends with error and using done', async () => {
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args, function cb () {
      throw new Error('Failed in post run')
    })

    try {
      await Callable(resolver, (_username, done) => {
        done()
      }, 2000)
      assert.isTrue(false)
    } catch ({ message }) {
      assert.equal(message, 'Failed in post run')
    }
  })

  it('do not run post run when actual test ends with error', async () => {
    let invoked = false
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args, function cb () {
      invoked = true
    })

    try {
      await Callable(resolver, (_username, done) => {
        done(new Error('Failed in test'))
      }, 2000)
      assert.isTrue(false)
    } catch ({ message }) {
      assert.equal(message, 'Failed in test')
      assert.isFalse(invoked)
    }
  })

  it('do not run post run when actual test throws error', async () => {
    let invoked = false
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args, function cb () {
      invoked = true
    })

    try {
      await Callable(resolver, (_username) => {
        throw new Error('Failed in test')
      }, 2000)
      assert.isTrue(false)
    } catch ({ message }) {
      assert.equal(message, 'Failed in test')
      assert.isFalse(invoked)
    }
  })

  it('do not run post run when test times out', async () => {
    let invoked = false
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args, function cb () {
      invoked = true
    })

    try {
      await Callable(resolver, async () => {
        await sleep(100)
      }, 10)
      assert.isTrue(false)
    } catch (error) {
      assert.instanceOf(error, TimeoutException)
      assert.isFalse(invoked)
    }
  })

  it('pass args to the post run callback', async () => {
    let name: null | string = null
    const args: any[string] = ['virk']
    const resolver = getFn<[string, Function]>(args, function cb (username) {
      name = username
    })

    await Callable(resolver, async () => {}, 10)
    assert.equal(name, 'virk')
  })
})
