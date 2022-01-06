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
import { Suite } from '../../src/Suite'
import { Group } from '../../src/Group'
import { Refiner } from '../../src/Refiner'
import { Emitter } from '../../src/Emitter'
import { pEvent } from '../../test-helpers'
import { TestEndNode } from '../../src/Contracts'
import { TestContext } from '../../src/TestContext'

test.group('execute | test', () => {
  test('run all tests inside a suite', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('run all tests inside a suite group', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group)
    group.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('run tests and groups as siblings', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    const group = new Group('sample group', emitter, refiner)
    group.each.setup(() => {
      stack.push('group test setup')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group).add(testInstance1)
    group.add(testInstance)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['group test setup', 'test', 'test 1'])
  })
})

test.group('execute | hooks', () => {
  test('run suite setup and teardown hooks', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.setup(() => stack.push('suite setup'))
    suite.teardown(() => stack.push('suite teardown'))

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['suite setup', 'test', 'test 1', 'suite teardown'])
  })

  test('run hooks cleanup functions', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.setup(() => {
      stack.push('suite setup')
      return () => {
        stack.push('suite setup cleanup')
      }
    })
    suite.teardown(() => {
      stack.push('suite teardown')
      return () => {
        stack.push('suite teardown cleanup')
      }
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, [
      'suite setup',
      'test',
      'test 1',
      'suite setup cleanup',
      'suite teardown',
      'suite teardown cleanup',
    ])
  })

  test('do not run tests when setup hook fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.setup(() => {
      stack.push('suite setup')
      throw new Error('blow up')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 0)
    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.isTrue(suiteEndEvent!.hasError)
    assert.equal(suiteEndEvent!.errors[0].phase, 'setup')
    assert.equal(suiteEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['suite setup'])
  })

  test('run cleanup hooks when setup hook fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.setup(() => {
      stack.push('suite setup')
      return function () {
        stack.push('suite setup cleanup')
      }
    })
    suite.setup(() => {
      stack.push('suite setup 1')
      throw new Error('blow up')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 0)
    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.isTrue(suiteEndEvent!.hasError)
    assert.equal(suiteEndEvent!.errors[0].phase, 'setup')
    assert.equal(suiteEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['suite setup', 'suite setup 1', 'suite setup cleanup'])
  })

  test('mark suite as failed when teardown hook fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.setup(() => {
      stack.push('suite setup')
      return function () {
        stack.push('suite setup cleanup')
      }
    })
    suite.teardown(() => {
      stack.push('suite teardown')
      throw new Error('blow up')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.isTrue(suiteEndEvent!.hasError)
    assert.equal(suiteEndEvent!.errors[0].phase, 'teardown')
    assert.equal(suiteEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'suite setup',
      'test',
      'test 1',
      'suite setup cleanup',
      'suite teardown',
    ])
  })

  test('call teardown cleanup functions when teardown hook files', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.teardown(() => {
      stack.push('suite teardown')
      return function () {
        stack.push('suite teardown cleanup')
      }
    })
    suite.teardown(() => {
      stack.push('suite teardown 1')
      throw new Error('blow up')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.isTrue(suiteEndEvent!.hasError)
    assert.equal(suiteEndEvent!.errors[0].phase, 'teardown')
    assert.equal(suiteEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'test',
      'test 1',
      'suite teardown',
      'suite teardown 1',
      'suite teardown cleanup',
    ])
  })

  test('fail when setup cleanup function fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.setup(() => {
      stack.push('suite setup')
      return function () {
        stack.push('suite setup cleanup')
        throw new Error('blow up')
      }
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.isTrue(suiteEndEvent!.hasError)
    assert.equal(suiteEndEvent!.errors[0].phase, 'setup:cleanup')
    assert.equal(suiteEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['suite setup', 'test', 'test 1', 'suite setup cleanup'])
  })

  test('fail when teardown cleanup function fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite('sample suite', emitter)
    suite.teardown(() => {
      stack.push('suite teardown')
      return function () {
        stack.push('suite teardown cleanup')
        throw new Error('blow up')
      }
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.isTrue(suiteEndEvent!.hasError)
    assert.equal(suiteEndEvent!.errors[0].phase, 'teardown:cleanup')
    assert.equal(suiteEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['test', 'test 1', 'suite teardown', 'suite teardown cleanup'])
  })
})
