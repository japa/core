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

test.group('execute | suites', () => {
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
    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, ['test', 'test 1'])
  })
})

test.group('execute | hooks', () => {
  test('run runner setup and teardown hooks', async (assert) => {
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
    runner.setup(() => stack.push('runner setup'))
    runner.teardown(() => stack.push('runner teardown'))

    const unit = new Suite('unit', emitter)
    unit.setup(() => stack.push('unit setup'))
    unit.teardown(() => stack.push('unit teardown'))

    const functional = new Suite('functional', emitter)
    functional.setup(() => stack.push('functional setup'))
    functional.teardown(() => stack.push('functional teardown'))

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, [
      'runner setup',
      'unit setup',
      'test',
      'unit teardown',
      'functional setup',
      'test 1',
      'functional teardown',
      'runner teardown',
    ])
  })

  test('do not run suites when runner setup hook fails', async (assert) => {
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
    runner.setup(() => {
      stack.push('runner setup')
      throw new Error('blow up')
    })
    runner.teardown(() => stack.push('runner teardown'))

    const unit = new Suite('unit', emitter)
    unit.setup(() => stack.push('unit setup'))
    unit.teardown(() => stack.push('unit teardown'))

    const functional = new Suite('functional', emitter)
    functional.setup(() => stack.push('functional setup'))
    functional.teardown(() => stack.push('functional teardown'))

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 0)
    assert.isTrue(runnerEndEvent!.hasError)
    assert.equal(runnerEndEvent!.errors[0].phase, 'setup')
    assert.equal(runnerEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, ['runner setup'])
  })

  test('mark runner as failed when setup cleanup functional fails', async (assert) => {
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
    runner.setup(() => {
      stack.push('runner setup')
      return function () {
        throw new Error('blow up')
      }
    })
    runner.teardown(() => {
      stack.push('runner teardown')
    })

    const unit = new Suite('unit', emitter)
    unit.setup(() => stack.push('unit setup'))
    unit.teardown(() => stack.push('unit teardown'))

    const functional = new Suite('functional', emitter)
    functional.setup(() => stack.push('functional setup'))
    functional.teardown(() => stack.push('functional teardown'))

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isTrue(runnerEndEvent!.hasError)
    assert.equal(runnerEndEvent!.errors[0].phase, 'setup:cleanup')
    assert.equal(runnerEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'runner setup',
      'unit setup',
      'test',
      'unit teardown',
      'functional setup',
      'test 1',
      'functional teardown',
      'runner teardown',
    ])
  })

  test('mark runner as failed when teardown hook fails', async (assert) => {
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
    runner.setup(() => {
      stack.push('runner setup')
    })
    runner.teardown(() => {
      stack.push('runner teardown')
      throw new Error('blow up')
    })

    const unit = new Suite('unit', emitter)
    unit.setup(() => stack.push('unit setup'))
    unit.teardown(() => stack.push('unit teardown'))

    const functional = new Suite('functional', emitter)
    functional.setup(() => stack.push('functional setup'))
    functional.teardown(() => stack.push('functional teardown'))

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isTrue(runnerEndEvent!.hasError)
    assert.equal(runnerEndEvent!.errors[0].phase, 'teardown')
    assert.equal(runnerEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'runner setup',
      'unit setup',
      'test',
      'unit teardown',
      'functional setup',
      'test 1',
      'functional teardown',
      'runner teardown',
    ])
  })

  test('mark runner as failed when teardown cleanup functional fails', async (assert) => {
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
    runner.setup(() => {
      stack.push('runner setup')
    })
    runner.teardown(() => {
      stack.push('runner teardown')
      return function () {
        throw new Error('blow up')
      }
    })

    const unit = new Suite('unit', emitter)
    unit.setup(() => stack.push('unit setup'))
    unit.teardown(() => stack.push('unit teardown'))

    const functional = new Suite('functional', emitter)
    functional.setup(() => stack.push('functional setup'))
    functional.teardown(() => stack.push('functional teardown'))

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isTrue(runnerEndEvent!.hasError)
    assert.equal(runnerEndEvent!.errors[0].phase, 'teardown:cleanup')
    assert.equal(runnerEndEvent!.errors[0].error.message, 'blow up')

    assert.deepEqual(stack, [
      'runner setup',
      'unit setup',
      'test',
      'unit teardown',
      'functional setup',
      'test 1',
      'functional teardown',
      'runner teardown',
    ])
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
    runner.registerReporter({
      name: 'list',
      open() {
        stack.push('list reporter open')
      },
      close() {
        stack.push('list reporter close')
      },
    })

    const unit = new Suite('unit', emitter)
    const functional = new Suite('functional', emitter)

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

    const [runnerEndEvent] = await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])

    assert.lengthOf(events, 4)
    assert.equal((events[0] as TestEndNode).title, 'test')
    assert.isFalse(events[0].hasError)

    assert.equal((events[1] as SuiteEndNode).name, 'unit')
    assert.isFalse(events[1].hasError)

    assert.equal((events[2] as TestEndNode).title, 'test 1')
    assert.isFalse(events[2].hasError)

    assert.equal((events[3] as SuiteEndNode).name, 'functional')
    assert.isFalse(events[3].hasError)

    assert.isNotNull(runnerEndEvent)
    assert.deepEqual(stack, ['list reporter open', 'test', 'test 1', 'list reporter close'])
  })
})

test.group('execute | uncaught exceptions', () => {
  test('manage uncaught exceptions for the process', async (assert) => {
    const errors: any[] = []
    const events: TestEndNode[] = []
    const emitter = new Emitter()
    const refiner = new Refiner({})

    emitter.on('uncaught:exception', (error) => {
      errors.push(error)
    })

    emitter.on('test:end', (event) => {
      events.push(event)
    })

    const runner = new Runner(emitter)
    const unit = new Suite('unit', emitter)

    const testInstance = new Test('test', new TestContext(), emitter, refiner)
    testInstance
      .run(() => {
        setTimeout(() => {
          throw new Error('blow up')
        })
      })
      .timeout(100)
      .waitForDone()

    runner.add(unit).manageUnHandledExceptions()
    unit.add(testInstance)

    await Promise.all([pEvent(emitter, 'runner:end'), runner.exec()])
    assert.lengthOf(events, 1)
    assert.lengthOf(errors, 1)

    assert.isTrue(events[0].hasError)
    assert.deepEqual(events[0].errors[0].error, errors[0])
    assert.equal(events[0].errors[0].phase, 'test')
  })
})
