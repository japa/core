/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'node:test'
import { assert } from 'chai'

import { Test } from '../../src/test/main.js'
import { Refiner } from '../../src/refiner.js'
import { Emitter } from '../../src/emitter.js'
import { TestContext } from '../../src/test_context.js'
import { sleep, pEvent, pEventTimes } from '../../test_helpers/index.js'

test.describe('execute | async', () => {
  test('execute test executor', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end')])
    assert.isDefined(event)
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('compute test context using a function', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test(
      '2 + 2 = 4',
      async () => {
        return new TestContext()
      },
      emitter,
      refiner
    )
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end')])
    assert.isDefined(event)
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('multiple calls to exec should result in a noop', async () => {
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

  test('fail test when executor raises an exception', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
      throw new Error('blow up')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end')])
    assert.isDefined(event)
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['executed'])
  })

  test('retry test before marking it as failed', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.equal(event!.retryAttempt, 2)
    assert.deepEqual(stack, ['executed', 'executed'])
    assert.equal(testInstance.options.retryAttempt, 2)
  })

  test('mark as failed when retries are busted', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
        throw new Error('blow up')
      })
      .timeout(0)
      .retry(2)

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.equal(event!.retryAttempt, 3)
    assert.deepEqual(stack, ['executed', 'executed', 'executed'])
    assert.equal(testInstance.options.retryAttempt, 3)
  })

  test('timeout test when takes too long', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
      await sleep(4000)
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 5000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'Test timeout')
    assert.deepEqual(stack, ['executed'])
  })

  test('increase test timeout', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
        await sleep(4000)
      })
      .timeout(5000)

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 6000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('increase test timeout from within the callback', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      testInstance.resetTimeout(5000)
      stack.push('executed')
      await sleep(4000)
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 6000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })
})

test.describe('execute | waitForDone', () => {
  test('execute test executor', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (__, d) => {
        stack.push('executed')
        setTimeout(() => d(), 100)
      })
      .waitForDone()

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end')])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('fail test when error is passed to done', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (__, d) => {
        stack.push('executed')
        setTimeout(() => d(new Error('blow up')), 100)
      })
      .waitForDone()

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end')])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['executed'])
  })

  test('fail test when executor raises an exception', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => d(), 100)
        throw new Error('blow up')
      })
      .waitForDone()

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end')])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['executed'])
  })

  test('retry test before marking it as failed', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    testInstance
      .run(async (__, d) => {
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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.equal(event!.retryAttempt, 2)
    assert.deepEqual(stack, ['executed', 'executed'])
    assert.equal(testInstance.options.retryAttempt, 2)
  })

  test('mark as failed when retries are busted', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (__, d) => {
        stack.push('executed')
        setTimeout(() => {
          d(new Error('blow up'))
        }, 100)
      })
      .waitForDone()
      .timeout(0)
      .retry(2)

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.equal(event!.retryAttempt, 3)
    assert.deepEqual(stack, ['executed', 'executed', 'executed'])
    assert.equal(testInstance.options.retryAttempt, 3)
  })

  test('timeout test when takes too long', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (__, d) => {
        stack.push('executed')
        setTimeout(() => {
          d()
        }, 4000)
      })
      .waitForDone()

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'Test timeout')
    assert.deepEqual(stack, ['executed'])
  })

  test('increase test timeout', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        stack.push('executed')
        setTimeout(() => {
          d()
        }, 4000)
      })
      .waitForDone()
      .timeout(5000)

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('increase test timeout from within the test callback', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async (_, d) => {
        testInstance.resetTimeout(5000)
        stack.push('executed')
        setTimeout(() => {
          d()
        }, 4000)
      })
      .waitForDone()

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })
})

test.describe('execute | hooks', () => {
  test('execute setup hooks', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup')
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['setup', 'executed'])
  })

  test('execute setup cleanup function', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup')
      return function () {
        stack.push('setup cleanup')
      }
    })

    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup 2')
      return function () {
        stack.push('setup cleanup 2')
      }
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['setup', 'setup 2', 'executed', 'setup cleanup 2', 'setup cleanup'])
  })

  test('do not run test when setup hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.setup(async (t) => {
      assert.deepEqual(t, testInstance)
      stack.push('setup')
      throw new Error('blow up')
    })

    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'setup')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['setup'])
  })

  test('call setup cleanup when one of the setup hooks fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'setup')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['setup', 'setup 1', 'setup cleanup'])
  })

  test('execute teardown hooks', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['setup', 'executed', 'teardown'])
  })

  test('execute teardown cleanup function', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['setup', 'executed', 'teardown', 'teardown cleanup'])
  })

  test('mark test failed when teardown hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'teardown')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['setup', 'executed', 'teardown'])
  })

  test('call teardown hooks when test fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['setup', 'executed', 'teardown'])
  })

  test('fail when setup cleanup function fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'setup:cleanup')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['setup', 'executed'])
  })

  test('fail when teardown cleanup function fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

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

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'teardown:cleanup')
    assert.instanceOf(event!.errors[0].error, Error)
    assert.equal(event!.errors[0].error.message, 'blow up')
    assert.deepEqual(stack, ['executed', 'teardown'])
  })

  test('execute test cleanup hooks', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      testInstance.cleanup(async (hasError, t) => {
        assert.isFalse(hasError)
        assert.deepEqual(t, testInstance)
        stack.push('test:cleanup')
      })

      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed', 'test:cleanup'])
  })

  test('execute test cleanup hooks when test fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      testInstance.cleanup(async (hasError, t) => {
        assert.isTrue(hasError)
        assert.deepEqual(t, testInstance)
        stack.push('test:cleanup')
      })

      throw new Error('something went wrong')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.deepEqual(stack, ['test:cleanup'])
  })

  test('mark test as failed when test cleaup hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      testInstance.cleanup(async (hasError, t) => {
        assert.isFalse(hasError)
        assert.deepEqual(t, testInstance)
        throw new Error('something went wrong')
      })

      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test:cleanup')
    assert.deepEqual(stack, ['executed'])
  })

  test('execute test cleanup hooks inside dataset', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar'])

    testInstance.run(async () => {
      testInstance.cleanup(async (hasError, t) => {
        assert.isFalse(hasError)
        assert.deepEqual(t, testInstance)
        stack.push('test:cleanup')
      })

      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed', 'test:cleanup', 'executed', 'test:cleanup'])
  })

  test('run test cleanup hooks in reverse order', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar'])

    testInstance.run(async () => {
      testInstance.cleanup(async (hasError, t) => {
        assert.isFalse(hasError)
        assert.deepEqual(t, testInstance)
        stack.push('test:cleanup')
      })
      testInstance.cleanup(async (hasError, t) => {
        assert.isFalse(hasError)
        assert.deepEqual(t, testInstance)
        stack.push('test:cleanup 1')
      })

      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, [
      'executed',
      'test:cleanup 1',
      'test:cleanup',
      'executed',
      'test:cleanup 1',
      'test:cleanup',
    ])
  })
})

test.describe('execute | executing', () => {
  test.afterEach(() => {
    Test.executingCallbacks = []
  })

  test('define executing callbacks for the test', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executing(() => {
      stack.push('executing hook')
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executing hook', 'executed'])
  })

  test('fail test when executing hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executing(() => {
      throw new Error('blowup')
    })

    const testInstance = new Test(
      '2 + 2 = 4',
      async () => {
        return new TestContext()
      },
      emitter,
      refiner
    )
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.equal(event!.errors[0].error.message, 'blowup')
    assert.deepEqual(stack, [])
  })

  test('do not call executing hooks when setup hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executing(() => {
      stack.push('dispose callback')
    })

    const testInstance = new Test(
      '2 + 2 = 4',
      async () => {
        return new TestContext()
      },
      emitter,
      refiner
    )
    testInstance
      .setup(async () => {
        throw new Error('blowup')
      })
      .run(() => {
        stack.push('executed')
      })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'setup')
    assert.equal(event!.errors[0].error.message, 'blowup')
    assert.deepEqual(stack, [])
  })
})

test.describe('execute | executed', () => {
  test.afterEach(() => {
    Test.executedCallbacks = []
  })

  test('define executed callbacks for the test', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executed(() => {
      stack.push('dispose hook')
    })

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed', 'dispose hook'])
  })

  test('fail test when executed hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executed(() => {
      throw new Error('blowup')
    })

    const testInstance = new Test(
      '2 + 2 = 4',
      async () => {
        return new TestContext()
      },
      emitter,
      refiner
    )
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.equal(event!.errors[0].error.message, 'blowup')
    assert.deepEqual(stack, ['executed'])
  })

  test('call executed hook when test fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executed(() => {
      stack.push('dispose callback')
    })

    const testInstance = new Test(
      '2 + 2 = 4',
      async () => {
        return new TestContext()
      },
      emitter,
      refiner
    )
    testInstance.run(async () => {
      throw new Error('blowup')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'test')
    assert.equal(event!.errors[0].error.message, 'blowup')
    assert.deepEqual(stack, ['dispose callback'])
  })

  test('do not call executed hooks when setup hook fails', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    Test.executed(() => {
      stack.push('dispose callback')
    })

    const testInstance = new Test(
      '2 + 2 = 4',
      async () => {
        return new TestContext()
      },
      emitter,
      refiner
    )
    testInstance
      .setup(async () => {
        throw new Error('blowup')
      })
      .run(() => {
        stack.push('executed')
      })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.hasError)
    assert.lengthOf(event!.errors, 1)
    assert.equal(event!.errors[0].phase, 'setup')
    assert.equal(event!.errors[0].error.message, 'blowup')
    assert.deepEqual(stack, [])
  })
})

test.describe('execute | dataset', () => {
  test('run test for all rows inside dataset', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar']).run(async (_, value) => {
      stack.push(value)
    })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 2, 8000),
    ])

    assert.deepEqual(stack, ['foo', 'bar'])
    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
  })

  test('tests inside dataset should not fail each other', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar']).run(async (_, value) => {
      stack.push(value)
      if (value === 'foo') {
        throw new Error('blow up')
      }
    })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 2, 8000),
    ])
    assert.deepEqual(stack, ['foo', 'bar'])

    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.isTrue(events[0].hasError)
    assert.equal(events[0].errors[0].error.message, 'blow up')

    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
    assert.isFalse(events[1].hasError)
  })

  test('run hooks for each row inside dataset', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    let setupIndex = 0
    let teardownIndex = 0

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

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 2, 8000),
    ])
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

  test('compute dataset lazily', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .with(async () => {
        return ['foo', 'bar']
      })
      .run(async (_, value) => {
        stack.push(value)
      })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 2, 8000),
    ])
    assert.deepEqual(stack, ['foo', 'bar'])

    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
  })

  test('fail when dataset is not an array or a function', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    assert.throw(
      () => testInstance.with({ foo: 'bar' } as any),
      'dataset must be an array or a function that returns an array'
    )
  })

  test('interpolate test title', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('{$i} - .add({0}, {1})', new TestContext(), emitter, refiner)
    testInstance
      .with([
        [1, 1, 2],
        [1, 2, 3],
        [2, 1, 3],
      ])
      .run(async (_, value) => {
        stack.push(value.join(','))
      })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 3, 8000),
    ])
    assert.deepEqual(stack, ['1,1,2', '1,2,3', '2,1,3'])

    assert.lengthOf(events, 3)
    assert.equal(events[0].title.expanded, '1 - .add(1, 1)')
    assert.equal(events[1].title.expanded, '2 - .add(1, 2)')
    assert.equal(events[2].title.expanded, '3 - .add(2, 1)')
  })

  test('escape value within curly braces', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('{$i} - .add(\\{0}, {1})', new TestContext(), emitter, refiner)
    testInstance
      .with([
        [1, 1, 2],
        [1, 2, 3],
        [2, 1, 3],
      ])
      .run(async (_, value) => {
        stack.push(value.join(','))
      })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 3, 8000),
    ])

    assert.deepEqual(stack, ['1,1,2', '1,2,3', '2,1,3'])

    assert.lengthOf(events, 3)
    assert.equal(events[0].title.expanded, '1 - .add({0}, 1)')
    assert.equal(events[1].title.expanded, '2 - .add({0}, 2)')
    assert.equal(events[2].title.expanded, '3 - .add({0}, 1)')
  })

  test('return undefined when value is missing', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test(
      '{$i} - .add({user.profile.name}, {1})',
      new TestContext(),
      emitter,
      refiner
    )
    testInstance
      .with([
        [1, 1, 2],
        [1, 2, 3],
        [2, 1, 3],
      ])
      .run(async (_, value) => {
        stack.push(value.join(','))
      })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 3, 8000),
    ])

    assert.deepEqual(stack, ['1,1,2', '1,2,3', '2,1,3'])

    assert.lengthOf(events, 3)
    assert.equal(events[0].title.expanded, '1 - .add(undefined, 1)')
    assert.equal(events[1].title.expanded, '2 - .add(undefined, 2)')
    assert.equal(events[2].title.expanded, '3 - .add(undefined, 1)')
  })

  test('isolate context between tests', async () => {
    const stack: string[] = []
    const contexts: TestContext[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', () => new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar']).run(async (ctx, value) => {
      contexts.push(ctx)
      stack.push(value)
    })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 2, 8000),
    ])

    assert.deepEqual(stack, ['foo', 'bar'])
    assert.lengthOf(contexts, 2)
    assert.notStrictEqual(contexts[0], contexts[1])

    assert.lengthOf(events, 2)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
  })

  test('reset timeout within test callback for each dataset row', async () => {
    const stack: string[] = []
    const contexts: TestContext[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', () => new TestContext(), emitter, refiner)
    testInstance.with(['foo', 'bar']).run(async (ctx, value) => {
      testInstance.resetTimeout()
      contexts.push(ctx)
      stack.push(value)
      await sleep(3000)
    })

    const [, events] = await Promise.all([
      testInstance.exec(),
      pEventTimes(emitter, 'test:end', 2, 8000),
    ])

    assert.deepEqual(stack, ['foo', 'bar'])
    assert.lengthOf(contexts, 2)
    assert.notStrictEqual(contexts[0], contexts[1])

    assert.lengthOf(events, 2)
    assert.equal(events[0].hasError, false)
    assert.equal(events[1].hasError, false)
    assert.deepEqual(events[0].dataset, { size: 2, row: 'foo', index: 0 })
    assert.deepEqual(events[1].dataset, { size: 2, row: 'bar', index: 1 })
  })
})

test.describe('execute | todo', () => {
  test('do not run test when no executor is defined', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 1000)])

    assert.isNull(event!)
  })
})

test.describe('execute | skip', () => {
  test('do not run test when test is skipped', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip(true)

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.isSkipped)
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, [])
  })

  test('skip by default', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip()

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.isSkipped)
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, [])
  })

  test('compute skip status lazily', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip(async () => true)

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.isSkipped)
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, [])
  })

  test('specify skip reason', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance
      .run(async () => {
        stack.push('executed')
      })
      .skip(async () => true, 'Do not run in CI')

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isTrue(event!.isSkipped)
    assert.equal(event!.skipReason, 'Do not run in CI')
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, [])
  })
})

test.describe('execute | refiner', () => {
  test('do not run test when refiner does not allows test title', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    refiner.add('tests', ['foo'])

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

  test('run test when its title is allowed by the refiner', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tests', ['2 + 2 = 4'])

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('run test when its tags are allowed by the refiner', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tags', ['@slow', '@regression'])

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.tags(['@regression'])
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isFalse(event!.hasError)
    assert.lengthOf(event!.errors, 0)
    assert.deepEqual(stack, ['executed'])
  })

  test('do not run test when all tags are not matched', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tags', ['@slow', '@regression'])
    refiner.matchAllTags(true)

    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    testInstance.tags(['@regression'])
    testInstance.run(async () => {
      stack.push('executed')
    })

    const [, event] = await Promise.all([testInstance.exec(), pEvent(emitter, 'test:end', 8000)])
    assert.isNull(event)
  })

  test('do not run test when there are pinned tests and the current one is not pinned', async () => {
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
    assert.isTrue(event?.isPinned)
    assert.isNull(event1)
    assert.deepEqual(stack, ['executed'])
  })

  test('do not run pinned test when its tags are not allowed by the refiner', async () => {
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

  test('do not run pinned test when its title is not allowed by the refiner', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tests', ['new test'])

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
    assert.isNull(event1)
    assert.deepEqual(stack, [])
  })
})
