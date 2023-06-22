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
import { Suite } from '../../src/suite/main.js'
import { Group } from '../../src/group/main.js'
import { Refiner } from '../../src/refiner.js'
import { Emitter } from '../../src/emitter.js'
import { pEvent } from '../../test_helpers/index.js'
import { TestEndNode } from '../../src/types.js'
import { TestContext } from '../../src/test_context.js'

test.describe('execute | test', () => {
  test('run all tests inside a suite', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('run all tests inside a suite group', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group)
    group.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('run tests and groups as siblings', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    group.each.setup(() => {
      stack.push('group test setup')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group).add(testInstance1)
    group.add(testInstance)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['group test setup', 'test', 'test 1'])
  })
})

test.describe('execute | hooks', () => {
  test('run suite setup and teardown hooks', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    suite.setup(() => {
      stack.push('suite setup')
    })
    suite.teardown(() => {
      stack.push('suite teardown')
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
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['suite setup', 'test', 'test 1', 'suite teardown'])
  })

  test('run hooks cleanup functions', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
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

  test('do not run tests when setup hook fails', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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

  test('run cleanup hooks when setup hook fails', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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

  test('mark suite as failed when teardown hook fails', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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

  test('call teardown cleanup functions when teardown hook files', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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

  test('fail when setup cleanup function fails', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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

  test('fail when teardown cleanup function fails', async () => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
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

test.describe('execute | refiner', () => {
  test('do not run hooks when refiner filters out the group title', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('groups', ['foo'])

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    suite.setup(() => {
      stack.push('suite setup')
    })
    suite.teardown(() => {
      stack.push('suite teardown')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group)
    group.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.deepEqual(stack, [])
    assert.isNull(suiteEndEvent)
  })

  test('do not run hooks when refiner filters out all the group tests', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tests', ['test 2'])

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    suite.setup(() => {
      stack.push('suite setup')
    })
    suite.teardown(() => {
      stack.push('suite teardown')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group)
    group.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.deepEqual(stack, [])
    assert.isNull(suiteEndEvent)
  })

  test('run hooks when one of the tests inside the group is allowed', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('tests', ['test 1'])

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    suite.setup(() => {
      stack.push('suite setup')
    })
    suite.teardown(() => {
      stack.push('suite teardown')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group)
    group.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['suite setup', 'test 1', 'suite teardown'])
  })

  test('run hooks when group is allowed by the refiner', async () => {
    const stack: string[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('groups', ['sample group'])

    const suite = new Suite<TestContext>('sample suite', emitter, refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    suite.setup(() => {
      stack.push('suite setup')
    })
    suite.teardown(() => {
      stack.push('suite teardown')
    })

    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    suite.add(group)
    group.add(testInstance).add(testInstance1)
    const [suiteEndEvent] = await Promise.all([pEvent(emitter, 'suite:end'), suite.exec()])

    assert.equal(suiteEndEvent!.name, 'sample suite')
    assert.deepEqual(stack, ['suite setup', 'test', 'test 1', 'suite teardown'])
  })
})
