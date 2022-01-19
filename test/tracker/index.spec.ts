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
import { Tracker } from '../../src/Tracker'
import { pEvent } from '../../test-helpers'
import { Group } from '../../src/Group'
import { TestContext } from '../../src/TestContext'

test.group('Tracker', () => {
  test('generate summary with multiple suites', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    const tracker = new Tracker()

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {})

    runner.add(unit).add(functional)
    unit.add(testInstance)
    functional.add(testInstance1)

    emitter.on('runner:start', (payload) => tracker.processEvent('runner:start', payload))
    emitter.on('runner:end', (payload) => tracker.processEvent('runner:end', payload))
    emitter.on('suite:start', (payload) => tracker.processEvent('suite:start', payload))
    emitter.on('suite:end', (payload) => tracker.processEvent('suite:end', payload))
    emitter.on('group:start', (payload) => tracker.processEvent('group:start', payload))
    emitter.on('group:end', (payload) => tracker.processEvent('group:end', payload))
    emitter.on('test:start', (payload) => tracker.processEvent('test:start', payload))
    emitter.on('test:end', (payload) => tracker.processEvent('test:end', payload))

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    const summary = tracker.getSummary()
    assert.isFalse(summary.hasError)
    assert.deepEqual(summary.runnerErrors, [])
    assert.equal(summary.total, 2)
    assert.equal(summary.passed, 2)
    assert.equal(summary.failed, 0)
    assert.equal(summary.skipped, 0)
    assert.equal(summary.todo, 0)
    assert.equal(summary.regression, 0)
    assert.lengthOf(summary.failureTree, 0)
    assert.lengthOf(summary.failedTestsTitles, 0)
  })

  test('track failed tests', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    const tracker = new Tracker()

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)
    const error = new Error('foo')

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      throw error
    })

    runner.add(unit).add(functional)
    unit.add(testInstance)
    functional.add(testInstance1)

    emitter.on('runner:start', (payload) => tracker.processEvent('runner:start', payload))
    emitter.on('runner:end', (payload) => tracker.processEvent('runner:end', payload))
    emitter.on('suite:start', (payload) => tracker.processEvent('suite:start', payload))
    emitter.on('suite:end', (payload) => tracker.processEvent('suite:end', payload))
    emitter.on('group:start', (payload) => tracker.processEvent('group:start', payload))
    emitter.on('group:end', (payload) => tracker.processEvent('group:end', payload))
    emitter.on('test:start', (payload) => tracker.processEvent('test:start', payload))
    emitter.on('test:end', (payload) => tracker.processEvent('test:end', payload))

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    const summary = tracker.getSummary()
    assert.isTrue(summary.hasError)
    assert.deepEqual(summary.runnerErrors, [])
    assert.equal(summary.total, 2)
    assert.equal(summary.passed, 1)
    assert.equal(summary.failed, 1)
    assert.equal(summary.skipped, 0)
    assert.equal(summary.todo, 0)
    assert.equal(summary.regression, 0)
    assert.deepEqual(summary.failureTree, [
      {
        name: 'functional',
        type: 'suite',
        errors: [],
        children: [
          {
            type: 'test',
            title: 'test 1',
            errors: [{ phase: 'test', error: error }],
          },
        ],
      },
    ])
    assert.deepEqual(summary.failedTestsTitles, ['test 1'])
  })

  test('track failed tests inside a group', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    const tracker = new Tracker()

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)
    const error = new Error('foo')

    const group = new Group('arithmetic', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {
      throw error
    })

    runner.add(unit).add(functional)
    unit.add(group)
    group.add(testInstance1)

    functional.add(testInstance)

    emitter.on('runner:start', (payload) => tracker.processEvent('runner:start', payload))
    emitter.on('runner:end', (payload) => tracker.processEvent('runner:end', payload))
    emitter.on('suite:start', (payload) => tracker.processEvent('suite:start', payload))
    emitter.on('suite:end', (payload) => tracker.processEvent('suite:end', payload))
    emitter.on('group:start', (payload) => tracker.processEvent('group:start', payload))
    emitter.on('group:end', (payload) => tracker.processEvent('group:end', payload))
    emitter.on('test:start', (payload) => tracker.processEvent('test:start', payload))
    emitter.on('test:end', (payload) => tracker.processEvent('test:end', payload))

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    const summary = tracker.getSummary()
    assert.isTrue(summary.hasError)
    assert.deepEqual(summary.runnerErrors, [])
    assert.equal(summary.total, 2)
    assert.equal(summary.passed, 1)
    assert.equal(summary.failed, 1)
    assert.equal(summary.skipped, 0)
    assert.equal(summary.todo, 0)
    assert.equal(summary.regression, 0)
    assert.deepEqual(summary.failureTree, [
      {
        name: 'unit',
        type: 'suite',
        errors: [],
        children: [
          {
            type: 'group',
            name: 'arithmetic',
            errors: [],
            children: [
              {
                type: 'test',
                title: 'test 1',
                errors: [{ phase: 'test', error: error }],
              },
            ],
          },
        ],
      },
    ])
    assert.deepEqual(summary.failedTestsTitles, ['test 1'])
  })

  test('track regression failures', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    const tracker = new Tracker()

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)
    const error = new Error('foo')

    const group = new Group('arithmetic', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1
      .run(() => {
        throw error
      })
      .fails()

    runner.add(unit).add(functional)
    unit.add(group)
    group.add(testInstance1)

    functional.add(testInstance)

    emitter.on('runner:start', (payload) => tracker.processEvent('runner:start', payload))
    emitter.on('runner:end', (payload) => tracker.processEvent('runner:end', payload))
    emitter.on('suite:start', (payload) => tracker.processEvent('suite:start', payload))
    emitter.on('suite:end', (payload) => tracker.processEvent('suite:end', payload))
    emitter.on('group:start', (payload) => tracker.processEvent('group:start', payload))
    emitter.on('group:end', (payload) => tracker.processEvent('group:end', payload))
    emitter.on('test:start', (payload) => tracker.processEvent('test:start', payload))
    emitter.on('test:end', (payload) => tracker.processEvent('test:end', payload))

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    const summary = tracker.getSummary()
    assert.isFalse(summary.hasError)
    assert.deepEqual(summary.runnerErrors, [])
    assert.equal(summary.total, 2)
    assert.equal(summary.passed, 1)
    assert.equal(summary.skipped, 0)
    assert.equal(summary.todo, 0)
    assert.equal(summary.failed, 0)
    assert.equal(summary.regression, 1)
    assert.deepEqual(summary.failureTree, [])
    assert.deepEqual(summary.failedTestsTitles, [])
  })

  test('track group hooks failure', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    const tracker = new Tracker()

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)
    const error = new Error('foo')

    const group = new Group('arithmetic', emitter, refiner)
    group.setup(() => {
      throw error
    })
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {})

    runner.add(unit).add(functional)
    unit.add(group)
    group.add(testInstance1)

    functional.add(testInstance)

    emitter.on('runner:start', (payload) => tracker.processEvent('runner:start', payload))
    emitter.on('runner:end', (payload) => tracker.processEvent('runner:end', payload))
    emitter.on('suite:start', (payload) => tracker.processEvent('suite:start', payload))
    emitter.on('suite:end', (payload) => tracker.processEvent('suite:end', payload))
    emitter.on('group:start', (payload) => tracker.processEvent('group:start', payload))
    emitter.on('group:end', (payload) => tracker.processEvent('group:end', payload))
    emitter.on('test:start', (payload) => tracker.processEvent('test:start', payload))
    emitter.on('test:end', (payload) => tracker.processEvent('test:end', payload))

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    const summary = tracker.getSummary()
    assert.isTrue(summary.hasError)
    assert.deepEqual(summary.runnerErrors, [])
    assert.equal(summary.total, 1)
    assert.equal(summary.passed, 1)
    assert.equal(summary.failed, 0)
    assert.equal(summary.skipped, 0)
    assert.equal(summary.todo, 0)
    assert.equal(summary.regression, 0)
    assert.deepEqual(summary.failureTree, [
      {
        name: 'unit',
        type: 'suite',
        errors: [],
        children: [
          {
            type: 'group',
            name: 'arithmetic',
            errors: [{ phase: 'setup', error: error }],
            children: [],
          },
        ],
      },
    ])
    assert.deepEqual(summary.failedTestsTitles, [])
  })

  test('track suite hooks failure', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})
    const tracker = new Tracker()

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)
    unit.setup(() => {
      throw error
    })

    const functional = new Suite('functional', emitter)
    const error = new Error('foo')

    const group = new Group('arithmetic', emitter, refiner)
    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance.run(() => {})

    const testInstance1 = new Test('test 1', new TestContext(), emitter, refiner)
    testInstance1.run(() => {})

    runner.add(unit).add(functional)
    unit.add(group)
    group.add(testInstance1)

    functional.add(testInstance)

    emitter.on('runner:start', (payload) => tracker.processEvent('runner:start', payload))
    emitter.on('runner:end', (payload) => tracker.processEvent('runner:end', payload))
    emitter.on('suite:start', (payload) => tracker.processEvent('suite:start', payload))
    emitter.on('suite:end', (payload) => tracker.processEvent('suite:end', payload))
    emitter.on('group:start', (payload) => tracker.processEvent('group:start', payload))
    emitter.on('group:end', (payload) => tracker.processEvent('group:end', payload))
    emitter.on('test:start', (payload) => tracker.processEvent('test:start', payload))
    emitter.on('test:end', (payload) => tracker.processEvent('test:end', payload))

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    const summary = tracker.getSummary()
    assert.isTrue(summary.hasError)
    assert.deepEqual(summary.runnerErrors, [])
    assert.equal(summary.total, 1)
    assert.equal(summary.passed, 1)
    assert.equal(summary.failed, 0)
    assert.equal(summary.skipped, 0)
    assert.equal(summary.todo, 0)
    assert.equal(summary.regression, 0)
    assert.deepEqual(summary.failureTree, [
      {
        name: 'unit',
        type: 'suite',
        errors: [{ phase: 'setup', error: error }],
        children: [],
      },
    ])
    assert.deepEqual(summary.failedTestsTitles, [])
  })
})
