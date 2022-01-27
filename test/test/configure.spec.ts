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
import { TestContext } from '../../src/TestContext'

test.group('configure', () => {
  test('create an instance of test', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    assert.instanceOf(testInstance, Test)
    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
    })
  })

  test('define timeout for the test', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.timeout(6000)

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 6000,
    })
  })

  test('disable timeout for the test', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.disableTimeout()

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 0,
    })
  })

  test('define test retries', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.retry(4)

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      retries: 4,
    })
  })

  test('mark test to be skipped', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.skip(true, 'Disabled for now')

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      isSkipped: true,
      skipReason: 'Disabled for now',
    })
  })

  test('compute skip lazily using a callback', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.skip(() => true, 'Disabled for now')

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      skipReason: 'Disabled for now',
    })
  })

  test('mark test as failing', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.fails('Should be 4, but returns 5 right now')

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      isFailing: true,
      failReason: 'Should be 4, but returns 5 right now',
    })
  })

  test('define tags', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.tags(['@slow'])

    assert.deepEqual(testInstance.options, {
      tags: ['@slow'],
      title: '2 + 2 = 4',
      timeout: 2000,
    })
  })

  test('append tags', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.tags(['@slow']).tags(['@regression'], 'append')

    assert.deepEqual(testInstance.options, {
      tags: ['@slow', '@regression'],
      title: '2 + 2 = 4',
      timeout: 2000,
    })
  })

  test('prepend tags', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.tags(['@slow']).tags(['@regression'], 'prepend')

    assert.deepEqual(testInstance.options, {
      tags: ['@regression', '@slow'],
      title: '2 + 2 = 4',
      timeout: 2000,
    })
  })

  test('inform runner to waitForDone', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.waitForDone()

    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
      waitsForDone: true,
    })
  })

  test('define dataset for the test', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.with(['foo', 'bar'])

    assert.deepEqual(testInstance.dataset, ['foo', 'bar'])
    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
    })
  })

  test('compute dataset lazily', async (assert) => {
    const testInstance = new Test('2 + 2 = 4', new TestContext(), new Emitter(), new Refiner({}))
    testInstance.with(() => ['foo', 'bar'])

    assert.isUndefined(testInstance.dataset)
    assert.deepEqual(testInstance.options, {
      tags: [],
      title: '2 + 2 = 4',
      timeout: 2000,
    })
  })

  test('do not mix hooks when a test is extended', async (assert) => {
    class Test1 extends Test<any, any> {
      public static disposeCallbacks = []
    }
    class Test2 extends Test<any, any> {
      public static disposeCallbacks = []
    }

    function disposeCallback() {}
    Test1.dispose(disposeCallback)

    assert.deepEqual(Test1.disposeCallbacks, [disposeCallback])
    assert.deepEqual(Test2.disposeCallbacks, [])
  })

  test('inherit parent dispose calls', async (assert) => {
    function disposeCallback() {}
    function disposeCallback1() {}
    Test.dispose(disposeCallback)

    class Test1 extends Test<any, any> {
      public static disposeCallbacks = [...Test.disposeCallbacks]
    }
    class Test2 extends Test<any, any> {
      public static disposeCallbacks = [...Test.disposeCallbacks]
    }

    Test2.dispose(disposeCallback1)

    assert.deepEqual(Test1.disposeCallbacks, [disposeCallback])
    assert.deepEqual(Test2.disposeCallbacks, [disposeCallback, disposeCallback1])
  })
})
