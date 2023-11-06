/*
 * @japa/runner
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { assert } from 'chai'
import { test } from 'node:test'
import { SummaryBuilder } from '../src/summary_builder.js'

test.describe('Summary builder', () => {
  test('build summary from registered reporters', () => {
    const builder = new SummaryBuilder()
    builder.use(() => {
      return [
        {
          key: 'Time',
          value: '10ms',
        },
        {
          key: 'Tests',
          value: '1 failed, 2 skipped, 3 todo',
        },
      ]
    })

    assert.deepEqual(builder.build(), [' Time  10ms', 'Tests  1 failed, 2 skipped, 3 todo'])
  })

  test('build summary when values are in multiple lines', () => {
    const builder = new SummaryBuilder()
    builder.use(() => {
      return [
        {
          key: 'Time',
          value: '10ms',
        },
        {
          key: 'Tests',
          value: ['1 failed', '2 skipped', '3 todo'],
        },
      ]
    })

    assert.deepEqual(builder.build(), [
      ' Time  10ms',
      ['Tests  1 failed', '       2 skipped', '       3 todo'].join('\n'),
    ])
  })
})
