/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'

import { Suite } from '../../src/Suite'
import { Runner } from '../../src/Runner'
import { Refiner } from '../../src/Refiner'
import { Emitter } from '../../src/Emitter'
import { ReporterContract } from '../../src/Contracts'

test.group('configure | runner', () => {
  test('create an instance of runner', async (assert) => {
    const runner = new Runner(new Emitter())
    assert.instanceOf(runner, Runner)
  })

  test('register suites with runner', async (assert) => {
    const emitter = new Emitter()

    const runner = new Runner(emitter)
    const refiner = new Refiner()
    const unitSuite = new Suite('unit', emitter, refiner)
    const functionalSuite = new Suite('functional', emitter, refiner)
    runner.add(unitSuite).add(functionalSuite)

    assert.deepEqual(runner.suites, [unitSuite, functionalSuite])
  })

  test('tap into suites to configure them', async (assert) => {
    const emitter = new Emitter()

    const runner = new Runner(emitter)
    const refiner = new Refiner()
    runner.onSuite((suite) => (suite.name = `configured:${suite.name}`))

    const unitSuite = new Suite('unit', emitter, refiner)
    const functionalSuite = new Suite('functional', emitter, refiner)
    runner.add(unitSuite).add(functionalSuite)

    assert.deepEqual(runner.suites, [unitSuite, functionalSuite])
    assert.equal(unitSuite.name, 'configured:unit')
    assert.equal(functionalSuite.name, 'configured:functional')
  })

  test('register reporters with runner', async (assert) => {
    const emitter = new Emitter()

    const runner = new Runner(emitter)
    const listReporter: ReporterContract = () => {}

    runner.registerReporter(listReporter)
    assert.deepEqual(runner.reporters, new Set([listReporter]))
  })

  test('register named reporter with runner', async (assert) => {
    const emitter = new Emitter()

    const runner = new Runner(emitter)
    const listReporter: ReporterContract = {
      name: 'list' as const,
      handler: () => {},
    }

    runner.registerReporter(listReporter)
    assert.deepEqual(runner.reporters, new Set([listReporter]))
  })
})
