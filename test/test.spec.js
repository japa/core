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
const Test = require('../src/Test')
const emitter = require('../lib/emitter')

const cleanup = function () {
  emitter.eventNames().forEach((event) => {
    emitter.removeAllListeners(event)
  })
}

test('run a test by executing the callback', function (assert) {
  assert.plan(1)
  let testCbCalled = false
  const test = new Test('dummy', function () {
    testCbCalled = true
  })
  test
  .run()
  .then(() => {
    assert.equal(testCbCalled, true)
    cleanup()
  })
})

test('emit the end event when test succeeds', function (assert) {
  assert.plan(1)
  let eventCalled = false
  const test = new Test('dummy', function () {
  })

  emitter.on('test:end', function () {
    eventCalled = true
  })

  test
  .run()
  .then(() => {
    assert.equal(eventCalled, true)
    cleanup()
  })
})

test('emit the end event when test fails', function (assert) {
  assert.plan(1)
  let eventCalled = false
  const test = new Test('dummy', function () {
    throw new Error('foo')
  })

  emitter.on('test:end', function () {
    eventCalled = true
  })

  test
  .run()
  .catch(() => {
    assert.equal(eventCalled, true)
    cleanup()
  })
})

test('emit test stats when test passes', function (assert) {
  assert.plan(1)
  let testStats = null
  const test = new Test('dummy', function () {
  })

  emitter.on('test:end', function (stats) {
    testStats = stats
  })

  test
  .run()
  .then(() => {
    delete testStats.duration
    assert.deepEqual(testStats, {
      title: 'dummy',
      error: null,
      status: 'passed',
      regression: false,
      timeout: false
    })
    cleanup()
  })
})

test('emit test stats when test fails', function (assert) {
  assert.plan(3)
  let testStats = null
  const error = new Error('foo')
  const test = new Test('dummy', function () {
    throw error
  })

  emitter.on('test:end', function (stats) {
    testStats = stats
  })

  test
  .run()
  .catch(() => {
    assert.deepEqual(testStats.error, error)
    assert.equal(testStats.status, 'failed')
    assert.equal(testStats.timeout, false)
    cleanup()
  })
})

test('emit test stats when test timeouts', function (assert) {
  assert.plan(3)
  let testStats = null
  const test = new Test('dummy', function (assert, done) {
  })
  test.timeout(50)

  emitter.on('test:end', function (stats) {
    testStats = stats
  })

  test
  .run()
  .catch(() => {
    assert.equal(testStats.error.message, 'Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    assert.equal(testStats.status, 'failed')
    assert.equal(testStats.timeout, true)
    cleanup()
  })
})

test('emit test stats when test is skipped', function (assert) {
  assert.plan(2)
  let testStats = null
  const test = new Test('dummy', function (assert) {
  }, true)
  emitter.on('test:end', function (stats) {
    testStats = stats
  })
  test
  .run()
  .then(() => {
    assert.equal(testStats.status, 'skipped')
    assert.equal(testStats.timeout, false)
    cleanup()
  })
})

test('emit test stats when test is a todo', function (assert) {
  assert.plan(2)
  let testStats = null
  const test = new Test('dummy')
  emitter.on('test:end', function (stats) {
    testStats = stats
  })
  test
  .run()
  .then(() => {
    assert.equal(testStats.status, 'todo')
    assert.equal(testStats.timeout, false)
    cleanup()
  })
})

test('emit start event when test starts', function (assert) {
  assert.plan(3)
  let testStats = null
  const test = new Test('dummy')
  emitter.on('test:start', function (stats) {
    testStats = stats
  })
  test
  .run()
  .then(() => {
    assert.equal(testStats.status, 'todo')
    assert.equal(testStats.timeout, undefined)
    assert.equal(testStats.title, 'dummy')
    cleanup()
  })
})

test('retry test for the retry times if test fails', function (assert) {
  assert.plan(2)
  let testsCounts = 0
  const test = new Test('dummy', function () {
    testsCounts++
    throw Error('foo')
  })
  test.retry(2)
  test
  .run()
  .catch((error) => {
    assert.equal(error.message, 'foo')
    assert.equal(testsCounts, 3)
    cleanup()
  })
})

test('retry test for the retry times if test timeouts', function (assert) {
  assert.plan(2)
  let testsCounts = 0
  const test = new Test('dummy', function (assert, done) {
    testsCounts++
  })

  test.retry(2)
  test.timeout(10)

  test
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    assert.equal(testsCounts, 3)
    cleanup()
  })
})

test('throw exception when assertion planned counts are not satisfied', function (t) {
  t.plan(1)
  const test = new Test('dummy', function (assert, done) {
    assert.plan(1)
    done()
  })

  test
  .run()
  .catch((error) => {
    t.equal(error.message, 'planned for 1 assertion but ran 0')
    cleanup()
  })
})

test('throw exception when assertion ran exceeds the planned count', function (t) {
  t.plan(1)
  const test = new Test('dummy', function (assert, done) {
    assert.plan(1)
    assert.equal(true, true)
    assert.equal(true, true)
    done()
  })

  test
  .run()
  .catch((error) => {
    t.equal(error.message, 'planned for 1 assertion but ran 2')
    cleanup()
  })
})

test('report error in the end event when assertions mis-matches', function (t) {
  t.plan(2)
  let testStats = null
  const test = new Test('dummy', function (assert, done) {
    assert.plan(1)
    assert.equal(true, true)
    assert.equal(true, true)
    done()
  })

  emitter.on('test:end', (stats) => {
    testStats = stats
  })

  test
  .run()
  .catch(() => {
    t.equal(testStats.error.message, 'planned for 1 assertion but ran 2')
    t.equal(testStats.status, 'failed')
    cleanup()
  })
})

test('report success when planned assertions are ran', function (t) {
  t.plan(2)
  let testStats = null
  const test = new Test('dummy', function (assert, done) {
    assert.plan(1)
    assert.equal(true, true)
    done()
  })

  emitter.on('test:end', (stats) => {
    testStats = stats
  })

  test
  .run()
  .then(() => {
    t.equal(testStats.error, null)
    t.equal(testStats.status, 'passed')
    cleanup()
  })
})

test('mark as passed when test is expected to fail and does fails', function (t) {
  t.plan(2)
  let testStats = null
  const test = new Test('dummy', function () {
    throw new Error('What the hell')
  }, false, true)

  emitter.on('test:end', (stats) => {
    testStats = stats
  })

  test
  .run()
  .then(() => {
    t.equal(testStats.status, 'passed')
    t.equal(testStats.regression, true)
    cleanup()
  })
})

test('throw exception when test was expected to fail but passed', function (t) {
  t.plan(1)
  const test = new Test('dummy', function () {
  }, false, true)

  test
  .run()
  .catch((error) => {
    t.equal(error.message, 'Test was expected to fail')
  })
})

test('throw exception when done is called twice', function (assert) {
  assert.plan(1)
  const test = new Test('dummy', function (assert, done) {
    done()
    done()
  })
  test
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Make sure you are not calling "done()" more than once')
  })
})

test('return error passed to done callback', function (assert) {
  assert.plan(1)
  const test = new Test('dummy', function (assert, done) {
    done('Just a old plain string error')
  })
  test
  .run()
  .catch((error) => {
    assert.equal(error, 'Just a old plain string error')
  })
})

test('throw exception when promise and done used together', function (assert) {
  assert.plan(1)
  const test = new Test('dummy', function (assert, done) {
    return new Promise(() => {})
  })
  test
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Method overload, returning promise and making use of "done()" is not allowed together')
  })
})
