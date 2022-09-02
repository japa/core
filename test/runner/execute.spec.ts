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
import { Runner } from '../../src/Runner'
import { Refiner } from '../../src/Refiner'
import { Emitter } from '../../src/Emitter'
import { pEvent } from '../../test-helpers'
import { TestContext } from '../../src/TestContext'
import { SuiteEndNode, TestEndNode } from '../../src/Contracts'

test.group('execute | runner', () => {
  test('run all suites tests', async (assert) => {
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

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter, refiner)
    const functional = new Suite('functional', emitter, refiner)

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

test.group('execute | reporters', () => {
  test('run reporters lifecycle methods', async (assert) => {
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

    const runner = new Runner(emitter)
    runner.registerReporter(() => {
      stack.push('list reporter open')
    })

    const unit = new Suite('unit', emitter, refiner)
    const functional = new Suite('functional', emitter, refiner)

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
})
