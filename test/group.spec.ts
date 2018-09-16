/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert } from 'chai'
import { Group } from '../src/Group'
import { Test } from '../src/Test'
import { TimeoutException } from '../src/Exceptions'
import { getFn, sleep } from './helpers'

describe('Group', () => {
  it('should register the tests to be invoked later', async () => {
    const group = new Group('sample', getFn([]), getFn([]))
    group.test('sample test', function cb () {})

    assert.lengthOf(group['_tests'], 1)
    assert.instanceOf(group['_tests'][0], Test)
  })

  it('should run the test when running the group', async () => {
    let invoked = false
    const group = new Group('sample', getFn([]), getFn([]))

    group.test('sample test', function cb () {
      invoked = true
    })

    await group.run()
    assert.isTrue(invoked)
  })

  it('should run the before hooks when running the group', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.before(function cb () {
      stack.push('before')
    })

    await group.run()
    assert.deepEqual(stack, ['before', 'test'])
  })

  it('should run the after hooks when running the group', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.before(function cb () {
      stack.push('before')
    })

    group.after(function cb () {
      stack.push('after')
    })

    await group.run()
    assert.deepEqual(stack, ['before', 'test', 'after'])
  })

  it('should not run the test and after hook, when before hook fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.before(function cb () {
      stack.push('before')
      throw new Error('stop')
    })

    group.after(function cb () {
      stack.push('after')
    })

    await group.run()
    assert.deepEqual(stack, ['before'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'stop')
  })

  it('should not run the upcoming before hooks, when before hook fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.before(function cb () {
      stack.push('before')
      throw new Error('stop')
    })

    group.before(function cb () {
      stack.push('before 2')
    })

    group.after(function cb () {
      stack.push('after')
    })

    await group.run()
    assert.deepEqual(stack, ['before'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'stop')
  })

  it('run beforeEach hooks before each test', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.before(function cb () {
      stack.push('before')
    })

    group.beforeEach(function cb () {
      stack.push('beforeEach')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.test('sample test 2', function cb () {
      stack.push('test 2')
    })

    await group.run()
    assert.deepEqual(stack, ['before', 'beforeEach', 'test', 'beforeEach', 'test 2'])
    assert.equal(group.toJSON().status, 'passed')
    assert.isNull(group.toJSON().error)
  })

  it('run afterEach hooks after each test', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.before(function cb () {
      stack.push('before')
    })

    group.beforeEach(function cb () {
      stack.push('beforeEach')
    })

    group.afterEach(function cb () {
      stack.push('afterEach')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.test('sample test', function cb () {
      stack.push('test 2')
    })

    await group.run()
    assert.deepEqual(stack, ['before', 'beforeEach', 'test', 'afterEach', 'beforeEach', 'test 2', 'afterEach'])
    assert.equal(group.toJSON().status, 'passed')
    assert.isNull(group.toJSON().error)
  })

  it('do not run test when beforeEach fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
      throw new Error('before each failed')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'before each failed')
  })

  it('do not run other beforeEach hooks when beforeEach fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
      throw new Error('before each failed')
    })

    group.beforeEach(function cb () {
      stack.push('beforeEach 2')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'before each failed')
  })

  it('do not run other afterEach hooks when beforeEach fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
      throw new Error('before each failed')
    })

    group.afterEach(function cb () {
      stack.push('afterEach')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'before each failed')
  })

  it('do not run other tests when beforeEach fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
      throw new Error('before each failed')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.test('sample test 2', function cb () {
      stack.push('test')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'before each failed')
  })

  it('do not run other tests when afterEach fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
    })

    group.afterEach(function cb () {
      stack.push('afterEach')
      throw new Error('after each failed')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.test('sample test 2', function cb () {
      stack.push('test')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach', 'test', 'afterEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'after each failed')
  })

  it('fail group when after hook fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
    })

    group.afterEach(function cb () {
      stack.push('afterEach')
    })

    group.after(function cb () {
      throw new Error('after failed')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.test('sample test 2', function cb () {
      stack.push('test 2')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach', 'test', 'afterEach', 'beforeEach', 'test 2', 'afterEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'after failed')
  })

  it('do not run other afterEach hooks when one fails', async () => {
    const stack: string[] = []
    const group = new Group('sample', getFn([]), getFn([]))

    group.beforeEach(function cb () {
      stack.push('beforeEach')
    })

    group.afterEach(function cb () {
      stack.push('afterEach')
      throw new Error('after each failed')
    })

    group.afterEach(function cb () {
      stack.push('afterEach 2')
      throw new Error('after each failed')
    })

    group.test('sample test', function cb () {
      stack.push('test')
    })

    group.test('sample test 2', function cb () {
      stack.push('test')
    })

    await group.run()
    assert.deepEqual(stack, ['beforeEach', 'test', 'afterEach'])
    assert.equal(group.toJSON().status, 'failed')
    assert.equal(group.toJSON().error!.message, 'after each failed')
  })

  it('define timeout for the test via group', async () => {
    const group = new Group('sample', getFn([]), getFn([]))

    group.timeout(300)
    const test = group.test('sample test', async function cb () {
      await sleep(500)
    })

    await group.run()
    assert.equal(test.toJSON().status, 'failed')
    assert.instanceOf(test.toJSON().error, TimeoutException)
  })

  it('raise error when user try to give timeout to the group after adding tests', async () => {
    const group = new Group('sample', getFn([]), getFn([]))

    group.test('sample test', async function cb () {
      await sleep(500)
    })

    const fn = () => group.timeout(300)
    assert.throw(fn, 'group.timeout must be called before defining the tests')
  })
})
