/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert } from 'chai'
import { Runner } from '../src/Runner'
import { Group } from '../src/Group'
import { getFn } from './helpers'
import { getTestReporter } from './helpers'

describe('Runner', () => {
  it('should run tests inside a group', async () => {
    const reporter = getTestReporter()
    let invoked = false

    const group = new Group('sample', getFn([]), getFn([]))
    group.test('sample test', function cb () {
      invoked = true
    })

    const runner = new Runner([group], {
      bail: false,
      timeout: 2000,
    })
    runner.reporter(reporter.fn.bind(reporter))

    await runner.run()
    assert.isTrue(invoked)
  })

  it('find first error in group tests', async () => {
    const reporter = getTestReporter()

    const group = new Group('sample', getFn([]), getFn([]))
    group.test('sample test', function cb () {
      throw new Error('failed')
    })

    const runner = new Runner([group], {
      bail: false,
      timeout: 2000,
    })
    runner.reporter(reporter.fn.bind(reporter))

    await runner.run()
    assert.isTrue(runner.hasErrors)
  })
})
