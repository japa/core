/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Refiner } from '../../src/Refiner'

test.group('Refiner | add', () => {
  test('add filter for test title', (assert) => {
    const refiner = new Refiner({})
    refiner.add('test', ['2 + 2 = 4'])
    assert.deepEqual(refiner.get('test'), ['2 + 2 = 4'])
  })

  test('add filter for test tags', (assert) => {
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow', '@regression'])
    refiner.add('tags', ['@fixes: #441'])
    assert.deepEqual(refiner.get('tags'), ['@slow', '@regression', '@fixes: #441'])
  })

  test('raise error when filter layer is invalid', (assert) => {
    const refiner = new Refiner({})
    assert.throw(
      () => refiner.add('foo' as any, ['@slow', '@regression']),
      'Cannot apply filter. Invalid layer "foo"'
    )
  })

  test('add filter for group title', (assert) => {
    const refiner = new Refiner({})
    refiner.add('group', ['Model | save'])
    assert.deepEqual(refiner.get('group'), ['Model | save'])
  })
})

test.group('Refiner | has', () => {
  test('return true when has applied one or more filters', (assert) => {
    const refiner = new Refiner({})
    refiner.add('test', ['2 + 2 = 4'])
    assert.isTrue(refiner.has('test'))
  })

  test('return false when no filters are applied', (assert) => {
    const refiner = new Refiner({})
    assert.isFalse(refiner.has('test'))
  })

  test('match specific value to exist inside applied filters', (assert) => {
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow', '@regression'])
    assert.isFalse(refiner.has('tags', '@foo'))
    assert.isTrue(refiner.has('tags', '@slow'))
  })
})

test.group('Refiner | hasAny', () => {
  test('match any value to exists inside applied filters', (assert) => {
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow', '@regression'])
    assert.isFalse(refiner.hasAny('tags', ['@foo', '@bar']))
    assert.isTrue(refiner.hasAny('tags', ['@foo', '@bar', '@slow']))
  })

  test('return false when no filters are applied', (assert) => {
    const refiner = new Refiner({})
    assert.isFalse(refiner.hasAny('tags', ['@foo', '@bar']))
    assert.isFalse(refiner.hasAny('tags', ['@foo', '@bar', '@slow']))
  })
})

test.group('Refiner | hasAll', () => {
  test('match all values to exists inside applied filters', (assert) => {
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow', '@regression'])
    assert.isFalse(refiner.hasAll('tags', ['@foo', '@bar']))
    assert.isFalse(refiner.hasAll('tags', ['@foo', '@bar', '@slow']))
    assert.isTrue(refiner.hasAll('tags', ['@regression', '@slow']))
  })

  test('return false when no filters are applied', (assert) => {
    const refiner = new Refiner({})
    assert.isFalse(refiner.hasAll('tags', ['@foo', '@bar']))
    assert.isFalse(refiner.hasAll('tags', ['@foo', '@bar', '@slow']))
  })
})

test.group('Refiner | get', () => {
  test('get applied filters', (assert) => {
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow', '@regression'])
    assert.deepEqual(refiner.get('tags'), ['@slow', '@regression'])
  })
})

test.group('Refiner | size', () => {
  test('get size of applied filters', (assert) => {
    const refiner = new Refiner({})
    refiner.add('tags', ['@slow', '@regression'])
    assert.equal(refiner.size('tags'), 2)
  })
})
