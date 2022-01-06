/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'

import { Test } from '../../src/Test'
import { Refiner } from '../../src/Refiner'
import { Emitter } from '../../src/Emitter'
import { TestEndNode } from '../../src/Contracts'
import { sleep, pEvent } from '../../test-helpers'
import { TestContext } from '../../src/TestContext'

test.group('execute | async', () => {
  test('execute test executor', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('multiple calls to exec should result in a noop', async (assert) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [endEvent] = await Promise.all([pEvent(emitter, 'test:end'), testInstance.exec()])
    assert.isFalse(endEvent!.hasError)
    assert.lengthOf(endEvent!.errors, 0)
    assert.deepEqual(stack, ['executed'])

    const [endEvent1] = await Promise.all([pEvent(emitter, 'test:end'), testInstance.exec()])
    assert.isNull(endEvent1)
  })

  test('fail test when executor raises an exception', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
      throw new Error('blow up')
    })

    await testInstance.exec()
  })

  test('retry test before marking it as failed', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.equal(event.retryAttempt, 2)
        assert.deepEqual(stack, ['executed', 'executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
        if (stack.length < 2) {
          throw new Error('blow up')
        }
      })
      .timeout(0)
      .retry(3)

    await testInstance.exec()
  }).timeout(0)

  test('mark as failed when retries are busted', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.equal(event.retryAttempt, 3)
        assert.deepEqual(stack, ['executed', 'executed', 'executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
        throw new Error('blow up')
      })
      .timeout(0)
      .retry(2)

    await testInstance.exec()
  }).timeout(0)

  test('timeout test when takes too long', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'Test timeout')
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
      await sleep(4000)
    })

    await testInstance.exec()
  }).timeout(0)

  test('increase test timeout', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
        await sleep(4000)
      })
      .timeout(5000)

    await testInstance.exec()
  }).timeout(0)
})

test.group('execute | waitForDone', () => {
  test('execute test executor', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => d(), 100)
      })
      .waitForDone()

    await testInstance.exec()
  })

  test('fail test when error is passed to done', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => d(new Error('blow up')), 100)
      })
      .waitForDone()

    await testInstance.exec()
  })

  test('fail test when executor raises an exception', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => d(), 100)
        throw new Error('blow up')
      })
      .waitForDone()

    await testInstance.exec()
  })

  test('retry test before marking it as failed', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.equal(event.retryAttempt, 2)
        assert.deepEqual(stack, ['executed', 'executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => {
          if (stack.length < 2) {
            d(new Error())
          } else {
            d()
          }
        }, 100)
      })
      .waitForDone()
      .timeout(0)
      .retry(3)

    await testInstance.exec()
  }).timeout(0)

  test('mark as failed when retries are busted', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.equal(event.retryAttempt, 3)
        assert.deepEqual(stack, ['executed', 'executed', 'executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => {
          d(new Error('blow up'))
        }, 100)
      })
      .waitForDone()
      .timeout(0)
      .retry(2)

    await testInstance.exec()
  }).timeout(0)

  test('timeout test when takes too long', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'Test timeout')
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => {
          d()
        }, 4000)
      })
      .waitForDone()

    await testInstance.exec()
  }).timeout(0)

  test('increase test timeout', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => {
          d()
        }, 4000)
      })
      .waitForDone()
      .timeout(5000)

    await testInstance.exec()
  }).timeout(0)
})

test.group('execute | hooks', () => {
  test('execute setup hooks', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['setup', 'executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup')
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('execute setup cleanup function', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['setup', 'executed', 'setup cleanup'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup')
      return function () {
        stack.push('setup cleanup')
      }
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('do not run test when setup hook fails', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'setup')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['setup'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup')
      throw new Error('blow up')
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('call setup cleanup when one of the setup hooks fails', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'setup')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['setup', 'setup 1', 'setup cleanup'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .setup(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('setup')
        return function () {
          stack.push('setup cleanup')
        }
      })
      .setup(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('setup 1')
        throw new Error('blow up')
      })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('execute teardown hooks', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['setup', 'executed', 'teardown'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .setup(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('setup')
      })
      .teardown(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('teardown')
      })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('execute teardown cleanup function', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['setup', 'executed', 'teardown', 'teardown cleanup'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .setup(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('setup')
      })
      .teardown(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('teardown')
        return function () {
          stack.push('teardown cleanup')
        }
      })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('mark test failed when teardown hook fails', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'teardown')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['setup', 'executed', 'teardown'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .setup(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('setup')
      })
      .teardown(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('teardown')
        throw new Error('blow up')
      })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('call teardown hooks when test fails', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'test')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['setup', 'executed', 'teardown'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .setup(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('setup')
      })
      .teardown(async (t) => {
        assert.deepEqual(t, testInstance)
        stack.push('teardown')
      })

    testInstance.run(async () => {
      stack.push('executed')
      throw new Error('blow up')
    })

    await testInstance.exec()
  })

  test('fail when setup cleanup function fails', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'setup:cleanup')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['setup', 'executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async () => {
      stack.push('setup')
      return function () {
        throw new Error('blow up')
      }
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('fail when teardown cleanup function fails', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.hasError)
        assert.lengthOf(event.errors, 1)
        assert.equal(event.errors[0].phase, 'teardown:cleanup')
        assert.instanceOf(event.errors[0].error, Error)
        assert.equal(event.errors[0].error.message, 'blow up')
        assert.deepEqual(stack, ['executed', 'teardown'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.teardown(async () => {
      stack.push('teardown')
      return function () {
        throw new Error('blow up')
      }
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })
})

test.group('execute | dataset', () => {
  test('run test for all rows inside dataset', async (assert) => {
    const events: TestEndNode[] = []
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar']).run(async (_, value) => {
      stack.push(value)
    })

    await testInstance.exec()

    assert.deepEqual(stack, ['foo', 'bar'])

    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
  })

  test('tests inside dataset should not fail each other', async (assert) => {
    const events: TestEndNode[] = []
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar']).run(async (_, value) => {
      stack.push(value)
      if (value === 'foo') {
        throw new Error('blow up')
      }
    })

    await testInstance.exec()
    assert.deepEqual(stack, ['foo', 'bar'])

    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.isTrue(events[0].hasError)
    // assert.equal(events[0].error.message, 'blow up')

    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
    assert.isFalse(events[1].hasError)
  })

  test('run hooks for each row inside dataset', async (assert) => {
    const events: TestEndNode[] = []
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    let setupIndex = 0
    let teardownIndex = 0

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .with(['foo', 'bar'])
      .run(async (_, value) => {
        stack.push(value)
      })
      .setup((t) => {
        stack.push(`setup ${t.dataset![setupIndex++]}`)
      })
      .teardown((t) => {
        stack.push(`teardown ${t.dataset![teardownIndex++]}`)
      })

    await testInstance.exec()
    assert.deepEqual(stack, [
      'setup foo',
      'foo',
      'teardown foo',
      'setup bar',
      'bar',
      'teardown bar',
    ])
    assert.lengthOf(events, 2)

    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.isFalse(events[0].hasError)

    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
    assert.isFalse(events[1].hasError)
  })

  test('compute dataset lazily', async (assert) => {
    const events: TestEndNode[] = []
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .with(async () => {
        return ['foo', 'bar']
      })
      .run(async (_, value) => {
        stack.push(value)
      })

    await testInstance.exec()

    assert.deepEqual(stack, ['foo', 'bar'])

    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
  })

  test('fail when dataset is not an array or a function', async (assert) => {
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    assert.throw(
      () => testInstance.with({ foo: 'bar' } as any),
      'dataset must be an array or a function that returns an array'
    )
  })
})

test.group('execute | todo', () => {
  test('do not run test when no executor is defined', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.isTodo)
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, [])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    await testInstance.exec()
  })
})

test.group('execute | skip', () => {
  test('do not run test when test is skipped', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.isSkipped)
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, [])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip(true)

    await testInstance.exec()
  })

  test('compute skip status lazily', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.isSkipped)
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, [])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip(async () => true)

    await testInstance.exec()
  })

  test('specify skip reason', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      try {
        assert.isTrue(event.isSkipped)
        assert.equal(event.skipReason, 'Do not run in CI')
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, [])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip(async () => true, 'Do not run in CI')

    await testInstance.exec()
  })
})

test.group('execute | refiner', () => {
  test('do not run test when refiner does not allows test title', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    refiner.add('test', ['foo'])

    emitter.emit = function (event: any) {
      if (event === 'test:start' || event === 'test:end') {
        throw new Error('Never expected to reach here')
      }

      return Promise.resolve()
    }

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    await testInstance.exec()
  })

  test('do not run test when refiner does not allows for test tags', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow'])

    emitter.emit = function (event: any) {
      if (event === 'test:start' || event === 'test:end') {
        throw new Error('Never expected to reach here')
      }

      return Promise.resolve()
    }

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    await testInstance.exec()
  })

  test('run test when its title is allowed by the refiner', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('test', ['2 + 2 = 4'])

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('run test when its tags are allowed by the refiner', async (assert, done) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tags', ['@slow', '@regression'])

    emitter.on('test:end', (event) => {
      try {
        assert.isFalse(event.hasError)
        assert.lengthOf(event.errors, 0)
        assert.deepEqual(stack, ['executed'])
        done()
      } catch (error) {
        done(error)
      }
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.tags(['@regression'])
    testInstance.run(async () => {
      stack.push('executed')
    })

    await testInstance.exec()
  })

  test('do not run test when there are pinned tests and the current one is not pinned', async (assert) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(() => {
        stack.push('executed')
      })
      .pin()

    const testInstance1 = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('executed1')
    })

    const [event] = await Promise.all([pEvent(emitter, 'test:end'), testInstance.exec()])
    const [event1] = await Promise.all([pEvent(emitter, 'test:end'), testInstance1.exec()])

    assert.isNotNull(event)
    assert.isNull(event1)
    assert.deepEqual(stack, ['executed'])
  })

  test('do not run pinned test when its tags are not allowed by the refiner', async (assert) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tags', ['@slow'])

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(() => {
        stack.push('executed')
      })
      .pin()

    const testInstance1 = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('executed1')
    })

    const [event] = await Promise.all([pEvent(emitter, 'test:end'), testInstance.exec()])
    const [event1] = await Promise.all([pEvent(emitter, 'test:end'), testInstance1.exec()])

    assert.isNull(event)
    assert.isNull(event1)
    assert.deepEqual(stack, [])
  })

  test('run test when its not pinned, but test title is allowed by the refiner', async (assert) => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('test', ['new test'])

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(() => {
        stack.push('executed')
      })
      .pin()

    const testInstance1 = new Test('new test', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('executed1')
    })

    const [event] = await Promise.all([pEvent(emitter, 'test:end'), testInstance.exec()])
    const [event1] = await Promise.all([pEvent(emitter, 'test:end'), testInstance1.exec()])

    assert.isNull(event)
    assert.isNotNull(event1)
    assert.deepEqual(stack, ['executed1'])
  })
})
