/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert } from 'chai'
import { Test } from '../src/Test'
import { TimeoutException } from '../src/Exceptions'
import { getFn, testOptions, sleep } from './helpers'

describe('Test', () => {
  it('should run the test', async () => {
    let invoked = false

    function callback () {
      invoked = true
    }

    const test = new Test('sample test', getFn([]), callback, testOptions())
    await test.run()

    assert.isTrue(invoked)
    assert.equal(test.toJSON().status, 'passed')
  })

  it('should wait for promise to resolve', async () => {
    let invoked = false

    function callback (): Promise<void> {
      return new Promise((resolve) => {
        sleep(100)
          .then(() => {
            invoked = true
            resolve()
          })
      })
    }

    const test = new Test('sample test', getFn([]), callback, testOptions())
    await test.run()

    assert.isTrue(invoked)
    assert.equal(test.toJSON().status, 'passed')
  })

  it('should wait for done to be called', async () => {
    let invoked = false

    async function callback (done) {
      setTimeout(() => {
        invoked = true
        done()
      }, 100)
    }

    const test = new Test('sample test', getFn([] as any), callback, testOptions())
    await test.run()

    assert.isTrue(invoked)
    assert.equal(test.toJSON().status, 'passed')
  })

  it('raise error when timeout exceeds', async () => {
    async function callback (done) {
      setTimeout(() => {
        done()
      }, 300)
    }

    const test = new Test('sample test', getFn([] as any), callback, testOptions({ timeout: 100 }))
    await test.run()

    assert.instanceOf(test.toJSON().error, TimeoutException)
    assert.equal(test.toJSON().status, 'failed')
  })

  it('do not timeout when timeout defined is 0', async () => {
    async function callback (done) {
      setTimeout(() => {
        done()
      }, 300)
    }

    const test = new Test('sample test', getFn([] as any), callback, testOptions({ timeout: 0 }))
    await test.run()

    assert.isNull(test.toJSON().error)
    assert.equal(test.toJSON().status, 'passed')
  })

  it('mark failed test as passed when regression is true', async () => {
    async function callback () {
      throw new Error('I expected this to fail')
    }

    const test = new Test('sample test', getFn([]), callback, testOptions({ regression: true }))
    await test.run()

    assert.equal(test.toJSON().error!.message, 'I expected this to fail')
    assert.equal(test.toJSON().status, 'passed')
    assert.equal(test.toJSON().regressionMessage, 'I expected this to fail')
  })

  it('mark failed test as failed when regression is true but error is timeout', async () => {
    async function callback (done) {
      setTimeout(() => {
        done()
      }, 300)
    }

    const test = new Test(
      'sample test',
      getFn([] as any),
      callback,
      testOptions({ regression: true, timeout: 100 }),
    )
    await test.run()

    assert.equal(test.toJSON().error!.message, 'Test timeout after 100 milliseconds')
    assert.equal(test.toJSON().status, 'failed')
    assert.equal(test.toJSON().regressionMessage, '')
  })

  it('should retry test for given occurrences', async () => {
    let counts = 0
    function callback () {
      counts++
      if (counts !== 3) {
        throw new Error('Failing intentionally')
      }
    }

    const test = new Test('sample test', getFn([]), callback, testOptions())
    await test.retry(3).run()

    assert.equal(test.toJSON().status, 'passed')
  }).timeout(4000)

  it('should update the timeout using the timeout fn', async () => {
    async function callback () {
      await sleep(500)
    }

    const test = new Test('sample test', getFn([]), callback, testOptions())
    await test.timeout(300).run()

    assert.equal(test.toJSON().status, 'failed')
    assert.instanceOf(test.toJSON().error, TimeoutException)
  }).timeout(4000)

  it('end test as todo when callback is not defined', async () => {
    const test = new Test('sample test', getFn([]), undefined, testOptions())
    await test.run()

    assert.equal(test.toJSON().status, 'todo')
    assert.isNull(test.toJSON().error)
  }).timeout(4000)

  it('mark test as failed when test passes but marked as regression', async () => {
    const test = new Test('sample test', getFn([]), function cb () {
    }, testOptions({ regression: true }))
    await test.run()

    assert.equal(test.toJSON().status, 'failed')
    assert.equal(test.toJSON().error!.message, 'Expected regression test to fail')
  })

  it('should skip test when skip is set to true', async () => {
    const test = new Test('sample test', getFn([]), function cb () {
      throw new Error('Never expected to be called')
    }, testOptions({ skip: true }))

    await test.run()

    assert.equal(test.toJSON().status, 'skipped')
  })
})
