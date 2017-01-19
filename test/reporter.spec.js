'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('tape')
const List = require('../src/Reporters/list')
const fakeEmitter = {
  on: function () {}
}

test('return true when error has actual and expected properties', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  const error = new Error('')
  error.actual = 'foo'
  error.expected = 'bar'
  assert.equal(list._hasDiff(error), true)
})

test('return true if actual is undefined and expected is null', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  const error = new Error('')
  error.actual = undefined
  error.expected = null
  assert.equal(list._hasDiff(error), true)
})

test('return true if actual is null and expected is null', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  const error = new Error('')
  error.actual = null
  error.expected = null
  assert.equal(list._hasDiff(error), true)
})

test('return true if actual is null and expected is undefined', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  const error = new Error('')
  error.actual = null
  error.expected = undefined
  assert.equal(list._hasDiff(error), true)
})

test('return color fn for test status', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  assert.deepEqual(list._getStatusColor('passed')._styles, ['green'])
})

test('return gray color when status is not defined', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  assert.deepEqual(list._getStatusColor('foo')._styles, ['gray'])
})

test('do not entertain test with invalid status', (assert) => {
  assert.plan(1)
  const list = List(fakeEmitter)
  list.onTestEnd({
    status: 'foo'
  })
  assert.equal(list.finalStats.total, 0)
})

test('increment tests counts', (assert) => {
  assert.plan(2)
  const list = List(fakeEmitter)
  list.onTestEnd({
    status: 'passed',
    title: 'foo',
    duration: 10
  })
  assert.equal(list.finalStats.total, 1)
  assert.equal(list.finalStats.passed, 1)
})

test('increment regression count when regression is true', (assert) => {
  assert.plan(3)
  const list = List(fakeEmitter)
  list.onTestEnd({
    status: 'passed',
    title: 'foo',
    duration: 10,
    regression: true
  })
  assert.equal(list.finalStats.total, 1)
  assert.equal(list.finalStats.passed, 1)
  assert.equal(list.finalStats.regression, 1)
})
