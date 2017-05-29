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
const $ = require('../lib/props')

const cleanup = function () {
  $.emitter.eventNames().forEach((event) => {
    $.emitter.removeAllListeners(event)
  })
}

test('run a hook by executing the callback', function (assert) {
  assert.plan(1)
  let hookCbCalled = false
  const hook = new Hook('sample group', 'beforeEach', function () {
    hookCbCalled = true
  }, $)
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
  }, $)

  $.emitter.on('hook:before:end', function () {
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
  }, $)

  $.emitter.on('hook:before:end', function () {
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
  }, $)

  $.emitter.on('hook:before:end', function (stats) {
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
  }, $)

  $.emitter.on('hook:before:end', function (stats) {
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
  }, $)
  hook.timeout(50)

  $.emitter.on('hook:before:end', function (stats) {
    hookStats = stats
  })

  hook
  .run()
  .catch(() => {
    assert.equal(hookStats.error.message, 'Hook timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    assert.equal(hookStats.status, 'failed')
    cleanup()
  })
})

test('emit start event when hook starts', function (assert) {
  assert.plan(2)
  let hookStats = null
  const hook = new Hook('sample group', 'before', function () {}, $)
  $.emitter.on('hook:before:start', function (stats) {
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

test('throw exception when returning a promise and making use of done callback', function (assert) {
  assert.plan(1)
  const hook = new Hook('sample group', 'before', function (done) {
    return new Promise(() => {})
  }, $)
  hook
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Method overload, returning promise and making use of "done()" is not allowed together')
    cleanup()
  })
})

test('throw exception when done is called twice', function (assert) {
  assert.plan(1)
  const hook = new Hook('sample group', 'before', function (done) {
    done()
    done()
  }, $)
  hook
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Make sure you are not calling "done()" more than once')
    cleanup()
  })
})

test('throw exception when hook throws exception', function (assert) {
  assert.plan(1)
  const hook = new Hook('sample group', 'before', function (done) {
    done('This is an error')
  }, $)
  hook
  .run()
  .catch((error) => {
    assert.equal(error, 'This is an error')
    cleanup()
  })
})

test('throw exception when timeout is not a number', function (assert) {
  assert.plan(1)
  const hook = new Hook('sample group', 'before', function () {
  }, $)
  try {
    hook.timeout('foo')
  } catch (error) {
    assert.equal(error.message, 'Make sure timeout is in milliseconds as a number')
    cleanup()
  }
})
