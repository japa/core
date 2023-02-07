/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { interpolate } from '../src/interpolate.js'

test.group('Interpolate', () => {
  test('interpolate object values inside a string', (assert) => {
    assert.equal(interpolate('hello {username}', { username: 'virk' }, 0), 'hello virk')
  })

  test('interpolate index inside a string', (assert) => {
    assert.equal(interpolate('hello at {$i}', { username: 'virk' }, 0), 'hello at 0')
  })

  test('interpolate literal value', (assert) => {
    assert.equal(interpolate('hello {$self}', 'virk', 0), 'hello virk')
  })

  test('interpolate when literval value is not a string', (assert) => {
    assert.equal(interpolate('hello {$self}', { foo: 'bar' }, 0), 'hello [object Object]')
  })

  test('interpolate key value is not a string', (assert) => {
    assert.equal(
      interpolate('hello {user}', { user: { name: 'virk' } }, 0),
      'hello [object Object]'
    )
  })
})
