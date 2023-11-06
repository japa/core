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
import { Group } from '../../src/group/main.js'
import { Suite } from '../../src/suite/main.js'
import { Refiner } from '../../src/refiner.js'
import { Emitter } from '../../src/emitter.js'
import { TestContext } from '../../src/test_context.js'

test.describe('configure', () => {
  test('create an instance of suite', async () => {
    const suite = new Suite('sample suite', new Emitter(), new Refiner())
    assert.instanceOf(suite, Suite)
    assert.equal(suite.name, 'sample suite')
  })

  test('add tests to suite', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const suite = new Suite<TestContext>('sample suite', new Emitter(), refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    suite.add(testInstance)

    assert.deepEqual(suite.stack, [testInstance])
  })

  test('add group to suite', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const suite = new Suite<TestContext>('sample suite', new Emitter(), refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    group.add(testInstance)
    suite.add(group)

    assert.deepEqual(suite.stack, [group])
  })

  test('tap into tests to configure them', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const suite = new Suite<TestContext>('sample suite', new Emitter(), refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    suite.onTest((t) => t.disableTimeout())
    suite.add(testInstance)

    assert.equal(testInstance.options.timeout, 0)
  })

  test('tap into group to configure them', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const suite = new Suite<TestContext>('sample suite', new Emitter(), refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    suite.onGroup((g) => g.each.timeout(0))

    suite.add(group)
    group.add(testInstance)

    assert.equal(testInstance.options.timeout, 0)
  })

  test('tap into tests after they have been registered', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const suite = new Suite<TestContext>('sample suite', new Emitter(), refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)
    const test1Instance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    /**
     * First add test to suite
     */
    suite.add(testInstance)

    /**
     * Define the hook afterwards
     */
    suite.onTest((t) => t.tags(['@hooked'], 'append'))

    /**
     * Add another test
     */
    suite.add(test1Instance)

    assert.deepEqual(testInstance.options.tags, ['@hooked'])
    assert.deepEqual(test1Instance.options.tags, ['@hooked'])
  })

  test('tap into groups after they have been registered', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner({})

    const suite = new Suite<TestContext>('sample suite', new Emitter(), refiner)
    const group = new Group<TestContext>('sample group', emitter, refiner)
    const testInstance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    const group1 = new Group<TestContext>('sample group', emitter, refiner)
    const test1Instance = new Test('2 + 2 = 4', new TestContext(), emitter, refiner)

    /**
     * First add test to group and group to suite
     */
    group.add(testInstance)
    suite.add(group)

    /**
     * Define hook
     */
    suite.onGroup((g) => g.tap((t) => t.tags(['@hooked'], 'append')))

    /**
     * Add another group to suite and test to the group
     */
    suite.add(group1)
    group1.add(test1Instance)

    assert.deepEqual(testInstance.options.tags, ['@hooked'])
    assert.deepEqual(test1Instance.options.tags, ['@hooked'])
  })
})
