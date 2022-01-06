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
import { TestContext } from '../../src/TestContext'

test.group('configure', () => {
  test('create an instance of group', async (assert) => {
    const group = new Group('sample group', new Emitter(), new Refiner({}))
    assert.instanceOf(group, Group)
    assert.equal(group.title, 'sample group')
  })

  test('add tests to group', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    group.add(testInstance)

    assert.deepEqual(group.tests, [testInstance])
  })

  test('define timeout for registered tests', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.each.timeout(5000)
    group.add(testInstance)

    assert.equal(testInstance.options.timeout, 5000)
  })

  test('define retries for registered tests', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.each.retry(3)
    group.add(testInstance)

    assert.equal(testInstance.options.retries, 3)
  })

  test('tap into tests to configure them', async (assert) => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const group = new Group('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.tap((t) => t.disableTimeout())
    group.add(testInstance)

    assert.equal(testInstance.options.timeout, 0)
  })
})
