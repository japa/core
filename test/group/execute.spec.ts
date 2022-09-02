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
import { Group } from '../../src/Group'
import { Refiner } from '../../src/Refiner'
import { Emitter } from '../../src/Emitter'
import { pEvent } from '../../test-helpers'
import { TestEndNode } from '../../src/Contracts'
import { TestContext } from '../../src/TestContext'

test.group('execute | test', () => {
  test('run all tests inside a group', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(groupEndEvent!.title, 'sample group')
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('do not interupt sibling tests when one test fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
      throw new Error('blow up')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isTrue(events[0].hasError)
    assert.equal(events[0].errors[0].phase, 'test')
    assert.equal(events[0].errors[0].error.message, 'blow up')

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(groupEndEvent!.title, 'sample group')
    assert.deepEqual(stack, ['test', 'test 1'])
  })
})

test.group('execute | hooks', () => {
  test('run group setup and teardown hooks', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => stack.push('group setup'))
    group.teardown(() => stack.push('group teardown'))

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(groupEndEvent!.title, 'sample group')
    assert.deepEqual(stack, ['group setup', 'test', 'test 1', 'group teardown'])
  })

  test('run hooks cleanup functions', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => {
      stack.push('group setup')
      return () => {
        stack.push('group setup cleanup')
      }
    })
    group.teardown(() => {
      stack.push('group teardown')
      return () => {
        stack.push('group teardown cleanup')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(groupEndEvent!.title, 'sample group')
    assert.deepEqual(stack, [
      'group setup',
      'test',
      'test 1',
      'group setup cleanup',
      'group teardown',
      'group teardown cleanup',
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

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => {
      stack.push('group setup')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 0)
    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isTrue(groupEndEvent!.hasError)
    assert.equal(groupEndEvent!.errors[0].phase, 'setup')
    assert.equal(groupEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['group setup'])
  })

  test('run cleanup hooks when setup hook fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => {
      stack.push('group setup')
      return function () {
        stack.push('group setup cleanup')
      }
    })
    group.setup(() => {
      stack.push('group setup 1')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 0)
    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isTrue(groupEndEvent!.hasError)
    assert.equal(groupEndEvent!.errors[0].phase, 'setup')
    assert.equal(groupEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['group setup', 'group setup 1', 'group setup cleanup'])
  })

  test('mark group as failed when teardown hook fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => {
      stack.push('group setup')
      return function () {
        stack.push('group setup cleanup')
      }
    })
    group.teardown(() => {
      stack.push('group teardown')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isTrue(groupEndEvent!.hasError)
    assert.equal(groupEndEvent!.errors[0].phase, 'teardown')
    assert.equal(groupEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'group setup',
      'test',
      'test 1',
      'group setup cleanup',
      'group teardown',
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

    const group = new Group('sample group', emitter, refiner)
    group.teardown(() => {
      stack.push('group teardown')
      return function () {
        stack.push('group teardown cleanup')
      }
    })
    group.teardown(() => {
      stack.push('group teardown 1')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isTrue(groupEndEvent!.hasError)
    assert.equal(groupEndEvent!.errors[0].phase, 'teardown')
    assert.equal(groupEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'test',
      'test 1',
      'group teardown',
      'group teardown 1',
      'group teardown cleanup',
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

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => {
      stack.push('group setup')
      return function () {
        stack.push('group setup cleanup')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isTrue(groupEndEvent!.hasError)
    assert.equal(groupEndEvent!.errors[0].phase, 'setup:cleanup')
    assert.equal(groupEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['group setup', 'test', 'test 1', 'group setup cleanup'])
  })

  test('fail when teardown cleanup function fails', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.teardown(() => {
      stack.push('group teardown')
      return function () {
        stack.push('group teardown cleanup')
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

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isTrue(groupEndEvent!.hasError)
    assert.equal(groupEndEvent!.errors[0].phase, 'teardown:cleanup')
    assert.equal(groupEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['test', 'test 1', 'group teardown', 'group teardown cleanup'])
  })
})

test.group('execute | each hooks', () => {
  test('register hooks for every test inside a group', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.each.setup(() => stack.push('group test setup'))
    group.each.setup(() => stack.push('group test setup 1'))
    group.each.teardown(() => stack.push('group test teardown'))
    group.each.teardown(() => stack.push('group test teardown 1'))

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isFalse(groupEndEvent!.hasError)

    assert.deepEqual(stack, [
      'group test setup',
      'group test setup 1',
      'test',
      'group test teardown',
      'group test teardown 1',
      'group test setup',
      'group test setup 1',
      'test 1',
      'group test teardown',
      'group test teardown 1',
    ])
  })
})

test.group('execute | refiner', () => {
  test('do not run tests when refiner does not allows group title', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('groups', ['foo'])

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => stack.push('group setup'))
    group.teardown(() => stack.push('group teardown'))

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 0)
    assert.isNull(groupEndEvent)
  })

  test('run tests when refiner allows group title', async (assert) => {
    const stack: string[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    refiner.add('groups', ['sample group'])

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const group = new Group('sample group', emitter, refiner)
    group.setup(() => stack.push('group setup'))
    group.teardown(() => stack.push('group teardown'))

    const testInstance = new Test('test', new TestContext(), emitter, refiner, group)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner, group)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    group.add(testInstance).add(testInstance1)
    const [groupEndEvent] = await Promise.all([pEvent(emitter, 'group:end'), group.exec()])

    assert.lengthOf(events, 2)
    assert.equal(events[0].title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal(events[1].title.expanded, 'test 1')
    assert.isFalse(events[1].hasError)

    assert.equal(groupEndEvent!.title, 'sample group')
    assert.isFalse(groupEndEvent!.hasError)

    assert.deepEqual(stack, ['group setup', 'test', 'test 1', 'group teardown'])
  })
})
