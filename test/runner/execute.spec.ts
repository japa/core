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

import { Runner } from '../../src/runner.js'
import { Test } from '../../src/test/main.js'
import { Emitter } from '../../src/emitter.js'
import { Refiner } from '../../src/refiner.js'
import { Suite } from '../../src/suite/main.js'
import { pEvent } from '../../test_helpers/index.js'
import { TestContext } from '../../src/test_context.js'
import { SuiteEndNode, TestEndNode } from '../../src/types.js'

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
