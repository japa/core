/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Test } from '../../src/test/main.js'
import { Group } from '../../src/group/main.js'
import { Emitter } from '../../src/emitter.js'
import { Refiner } from '../../src/refiner.js'

test.group('Refiner', () => {
  test('add filter for test title', (assert) => {
    const refiner = new Refiner({})

    const emitter = new Emitter()
    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner)
    refiner.add('tests', [testInstance.title])

    assert.isTrue(refiner.allows(testInstance))
  })

  test('add filter for test tags', (assert) => {
    const refiner = new Refiner({})

    const emitter = new Emitter()
    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner)
    testInstance.tags(['@fixes: #441'])

    refiner.add('tags', ['@slow', '@regression'])
    refiner.add('tags', ['@fixes: #441'])
    assert.isTrue(refiner.allows(testInstance))
  })

  test('add filter for group title', (assert) => {
    const refiner = new Refiner({})
    const emitter = new Emitter()
    const groupInstance = new Group('Maths', emitter, refiner)

    /**
     * Group must have a test to be allowed by the filtered
     */
    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner, groupInstance)
    groupInstance.add(testInstance)

    refiner.add('groups', [groupInstance.title])
    assert.isTrue(refiner.allows(groupInstance))
  })

  test('pin test', (assert) => {
    const refiner = new Refiner({})
    const emitter = new Emitter()
    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner)
    refiner.pinTest(testInstance)

    assert.isTrue(refiner.allows(testInstance))
  })

  test('apply layers of filters on a test', (assert) => {
    const refiner = new Refiner({})
    const emitter = new Emitter()

    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner)
    const testInstance1 = new Test('2 + 2 = 4', {}, emitter, refiner).tags(['@slow'])
    const testInstance2 = new Test('2 + 2 = 4', {}, emitter, refiner).pin().tags(['@slow'])
    const testInstance3 = new Test('3 + 3 = 6', {}, emitter, refiner).pin().tags(['@slow'])

    refiner.add('tags', ['@slow'])
    refiner.add('tests', ['2 + 2 = 4'])

    assert.isFalse(refiner.allows(testInstance))
    assert.isFalse(refiner.allows(testInstance1))
    assert.isTrue(refiner.allows(testInstance2))
    assert.isFalse(refiner.allows(testInstance3))
  })

  test('disallow test with matching negated tag', (assert) => {
    const refiner = new Refiner({})

    const emitter = new Emitter()
    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner)
    testInstance.tags(['@fixes: #441', '@network'])

    refiner.add('tags', ['@slow', '@regression'])
    refiner.add('tags', ['@fixes: #441'])
    refiner.add('tags', ['!@network'])
    assert.isFalse(refiner.allows(testInstance))
  })

  test('allow test with non matching negated tag', (assert) => {
    const refiner = new Refiner({})

    const emitter = new Emitter()
    const testInstance = new Test('2 + 2 = 4', {}, emitter, refiner)
    testInstance.tags(['@fixes: #441'])

    refiner.add('tags', ['!@network'])
    assert.isTrue(refiner.allows(testInstance))
  })

  test('do not allow lone tests when group filter is applied', (assert) => {
    const refiner = new Refiner({})
    const emitter = new Emitter()
    const groupInstance = new Group('Maths', emitter, refiner)
    const loneTestInstance = new Test('2 + 2 = 4', {}, emitter, refiner)

    refiner.add('groups', [groupInstance.title])
    assert.isFalse(refiner.allows(loneTestInstance))
  })
})
