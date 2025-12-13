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

import { Runner } from '../../src/runner.ts'
import { Test } from '../../src/test/main.ts'
import { Emitter } from '../../src/emitter.ts'
import { Refiner } from '../../src/refiner.ts'
import { Suite } from '../../src/suite/main.ts'
import { pEvent } from '../../tests_helpers/index.ts'
import { TestContext } from '../../src/test_context.ts'
import { type SuiteEndNode, type TestEndNode } from '../../src/types.ts'

test.describe('execute | runner', () => {
  test('run all suites tests', async () => {
    const stack: string[] = []
    const events: (TestEndNode | SuiteEndNode)[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    emitter.on('suite:end', (event) => {
      events.push(event)
    })

    const runner = new Runner<TestContext>(emitter)
    const unit = new Suite<TestContext>('unit', emitter, refiner)
    const functional = new Suite<TestContext>('functional', emitter, refiner)

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    runner.add(unit).add(functional)
    unit.add(testInstance)
    functional.add(testInstance1)

    const [runnerEndEvent] = await Promise.all([
      pEvent(emitter, 'runner:end'),
      (async () => {
        await runner.start()
        await runner.exec()
        await runner.end()
      })(),
    ])

    assert.isFalse(runner.failed)
    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title.expanded, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('mark runner as failed when a suite fails', async () => {
    const stack: string[] = []
    const events: (TestEndNode | SuiteEndNode)[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    emitter.on('suite:end', (event) => {
      events.push(event)
    })

    const runner = new Runner<TestContext>(emitter)
    const unit = new Suite<TestContext>('unit', emitter, refiner)
    const functional = new Suite<TestContext>('functional', emitter, refiner)

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
      throw new Error('blow up')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    runner.add(unit).add(functional)
    unit.add(testInstance)
    functional.add(testInstance1)

    const [runnerEndEvent] = await Promise.all([
      pEvent(emitter, 'runner:end'),
      (async () => {
        await runner.start()
        await runner.exec()
        await runner.end()
      })(),
    ])

    assert.isTrue(runner.failed)
    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title.expanded, 'test')
    assert.isTrue(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isTrue(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title.expanded, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, ['test', 'test 1'])
  })

  test('skip upcoming suites when a test fails in bail mode', async () => {
    const stack: string[] = []
    const events: (TestEndNode | SuiteEndNode)[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    emitter.on('suite:end', (event) => {
      events.push(event)
    })

    const runner = new Runner<TestContext>(emitter)
    const unit = new Suite<TestContext>('unit', emitter, refiner)
    const functional = new Suite<TestContext>('functional', emitter, refiner)
    runner.add(unit).add(functional)
    runner.bail()

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
      throw new Error('blow up')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    unit.add(testInstance)
    functional.add(testInstance1)

    const [runnerEndEvent] = await Promise.all([
      pEvent(emitter, 'runner:end'),
      (async () => {
        await runner.start()
        await runner.exec()
        await runner.end()
      })(),
    ])

    assert.isTrue(runner.failed)
    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title.expanded, 'test')
    assert.isTrue(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isTrue(events[1].hasError)

    assert.isTrue((events[2] as TestEndNode).isSkipped)
    assert.equal((events[3] as SuiteEndNode).name, 'functional')

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, ['test'])
  })
})

test.describe('execute | reporters', () => {
  test('run reporters lifecycle methods', async () => {
    const stack: string[] = []
    const events: (TestEndNode | SuiteEndNode)[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    emitter.on('suite:end', (event) => {
      events.push(event)
    })

    const runner = new Runner<TestContext>(emitter)
    runner.registerReporter(() => {
      stack.push('list reporter open')
    })

    const unit = new Suite<TestContext>('unit', emitter, refiner)
    const functional = new Suite<TestContext>('functional', emitter, refiner)

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {
      stack.push('test')
    })

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      stack.push('test 1')
    })

    runner.add(unit).add(functional)
    unit.add(testInstance)
    functional.add(testInstance1)

    const [runnerEndEvent] = await Promise.all([
      pEvent(emitter, 'runner:end'),
      (async () => {
        await runner.start()
        await runner.exec()
        await runner.end()
      })(),
    ])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title.expanded, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title.expanded, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, ['list reporter open', 'test', 'test 1'])
  })

  test('call named reporters handlers on start', async (t) => {
    const listReporter = {
      name: 'list',
      handler: () => {},
    }

    const mock = t.mock.method(listReporter, 'handler')
    await new Runner(new Emitter()).registerReporter(listReporter).start()

    assert.equal(mock.mock.calls.length, 1)
  })
})
