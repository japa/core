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

    const group = new Group('sample', getFn([]), getFn([]), { bail: false, timeout: 2000 })
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

    const group = new Group('sample', getFn([]), getFn([]), { bail: false, timeout: 2000 })
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

  it('stop on first test failure when bail is true', async () => {
    const reporter = getTestReporter()
    let invoked = false

    const group = new Group('sample', getFn([]), getFn([]), { bail: true, timeout: 2000 })
    group.test('sample test', function cb () {
      throw new Error('failed')
    })

    group.test('sample test 2', function cb () {
      invoked = true
    })

    const runner = new Runner([group], {
      bail: true,
      timeout: 2000,
    })
    runner.reporter(reporter.fn.bind(reporter))

    await runner.run()
    assert.isFalse(invoked)
  })

  it('stop on first test failure across multiple groups when bail is true', async () => {
    const reporter = getTestReporter()
    let invoked = false

    const group = new Group('sample', getFn([]), getFn([]), { bail: true, timeout: 2000 })
    const group1 = new Group('sample', getFn([]), getFn([]), { bail: true, timeout: 2000 })

    group.test('sample test', function cb () {
      throw new Error('failed')
    })

    group1.test('sample test 2', function cb () {
      invoked = true
    })

    const runner = new Runner([group, group1], {
      bail: true,
      timeout: 2000,
    })
    runner.reporter(reporter.fn.bind(reporter))

    await runner.run()
    assert.isFalse(invoked)
  })

  it('run runner hooks', async () => {
    const stack: string[] = []
    const reporter = getTestReporter()

    const group = new Group('sample', getFn([]), getFn([]), { bail: true, timeout: 2000 })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    const runner = new Runner([group], {
      bail: true,
      timeout: 2000,
    })

    runner.reporter(reporter.fn.bind(reporter))
    runner.before(async () => {
      stack.push('runner:before:1')
    })
    runner.before(async () => {
      stack.push('runner:before:2')
    })

    runner.after(async () => {
      stack.push('runner:after:1')
    })
    runner.after(async () => {
      stack.push('runner:after:2')
    })

    await runner.run()
    assert.deepEqual(stack, [
      'runner:before:1',
      'runner:before:2',
      'test',
      'runner:after:1',
      'runner:after:2',
    ])
  })
})
