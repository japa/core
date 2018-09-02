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

describe('Reporter', () => {
  it('should run tests inside a group', async () => {
    let invoked = false
    const group = new Group('sample', getFn([]))
    group.test('sample test', function cb () {
      invoked = true
    })

    const runner = new Runner([group], {
      bail: false,
    })

    await runner.run()
    assert.isTrue(invoked)
  })

  it('define custom reporter', async () => {
    const events: any[] = []
    const group = new Group('sample', getFn([]))
    group.test('sample test', function cb () {})

    const runner = new Runner([group], {
      bail: false,
    })

    runner.reporter(function cb (emitter) {
      emitter.on('test:started', (data) => events.push(data))
      emitter.on('test:completed', (data) => events.push(data))
      emitter.on('group:started', (data) => events.push(data))
      emitter.on('group:completed', (data) => events.push(data))
    })

    await runner.run()
    assert.deepEqual(events[0], {
      title: 'sample',
      status: 'pending',
      error: null,
    })

    assert.deepEqual(events[1], {
      title: 'sample test',
      status: 'pending',
      regressionMessage: '',
      error: null,
      duration: 0,
    })

    assert.equal(events[2].status, 'passed')
    assert.equal(events[2].title, 'sample test')

    assert.deepEqual(events[3], {
      title: 'sample',
      status: 'passed',
      error: null,
    })
  })
})
