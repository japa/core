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
const Hook = require('../src/Hook')
const emitter = require('../lib/emitter')

const cleanup = function () {
  emitter.eventNames().forEach((event) => {
    emitter.removeAllListeners(event)
  })
}

test('run a hook by executing the callback', function (assert) {
  assert.plan(1)
  let hookCbCalled = false
  const hook = new Hook('sample group', 'beforeEach', function () {
    hookCbCalled = true
  })
  hook
  .run()
  .then(() => {
    assert.equal(hookCbCalled, true)
  })
})

test('emit the end event when hook succeeds', function (assert) {
  assert.plan(1)
  let eventCalled = false
  const hook = new Hook('sample group', 'before', function () {
  })

  emitter.on('hook:before:end', function () {
    eventCalled = true
  })

  hook
  .run()
  .then(() => {
    assert.equal(eventCalled, true)
    cleanup()
  })
})

test('emit the end event when hook fails', function (assert) {
  assert.plan(1)
  let eventCalled = false
  const hook = new Hook('sample group', 'before', function () {
    throw new Error('foo')
  })

  emitter.on('hook:before:end', function () {
    eventCalled = true
  })

  hook
  .run()
  .catch(() => {
    assert.equal(eventCalled, true)
    cleanup()
  })
})

test('emit hook stats when hook passes', function (assert) {
  assert.plan(1)
  let hookStats = null
  const hook = new Hook('sample group', 'before', function () {
  })

  emitter.on('hook:before:end', function (stats) {
    hookStats = stats
  })

  hook
  .run()
  .then(() => {
    delete hookStats.duration
    assert.deepEqual(hookStats, {
      title: 'sample group',
      error: null,
      status: 'passed'
    })
    cleanup()
  })
})

test('emit hook stats when hook fails', function (assert) {
  assert.plan(2)
  let hookStats = null
  const error = new Error('foo')
  const hook = new Hook('sample group', 'before', function () {
    throw error
  })

  emitter.on('hook:before:end', function (stats) {
    hookStats = stats
  })

  hook
  .run()
  .catch(() => {
    assert.deepEqual(hookStats.error, error)
    assert.equal(hookStats.status, 'failed')
    cleanup()
  })
})

test('emit hook stats when hook timeouts', function (assert) {
  assert.plan(2)
  let hookStats = null
  const hook = new Hook('sample group', 'before', function (done) {
  })
  hook.timeout(50)

  emitter.on('hook:before:end', function (stats) {
    hookStats = stats
  })

  hook
  .run()
  .catch(() => {
    assert.equal(hookStats.error.message, 'Hook timeout, make sure to call done() or increase timeout')
    assert.equal(hookStats.status, 'failed')
    cleanup()
  })
})

test('emit start event when hook starts', function (assert) {
  assert.plan(2)
  let hookStats = null
  const hook = new Hook('sample group', 'before', function () {})
  emitter.on('hook:before:start', function (stats) {
    hookStats = stats
  })
  hook
  .run()
  .then(() => {
    assert.equal(hookStats.status, 'pending')
    assert.equal(hookStats.title, 'sample group')
    cleanup()
  })
})
