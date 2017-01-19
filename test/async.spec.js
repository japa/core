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
const Callable = require('../src/Callable')
const Hook = require('../src/Hook')
const Test = require('../src/Test')

test('resolve the function when it is async', function (assert) {
  assert.plan(1)
  let asyncCalled = false
  const fn = async function () {
    asyncCalled = true
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .then(() => {
    assert.equal(asyncCalled, true)
  })
})

test('throw exception when is explicit async and accepts done', function (assert) {
  assert.plan(1)
  const fn = async function (done) {
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'METHOD OVERLOAD:ASYNC')
  })
})

test('reject method when error thrown from async method', function (assert) {
  assert.plan(1)
  const fn = async function () {
    throw new Error('async error')
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error.message, 'async error')
  })
})

test('timeout when async method does not respond before timeout', function (assert) {
  assert.plan(1)
  const fn = async function () {
    await new Promise((resolve) => {
      setTimeout(function () {
        resolve()
      }, 200)
    })
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'TIMEOUT')
  })
})

test('disable timeouts when timeout is zero', function (assert) {
  assert.plan(1)
  const start = new Date()
  const fn = async function () {
    await new Promise((resolve) => {
      setTimeout(function () {
        resolve()
      }, 2200)
    })
  }

  const callable = new Callable(fn, 0, 0)
  callable
  .run()
  .then(() => {
    assert.ok(new Date() - start > 2000)
  })
})

test('throw exception when hook is an async function and making use of done', function (assert) {
  assert.plan(1)
  const hook = new Hook('sample group', 'before', async function (done) {
  })
  hook
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Method overload, async functions and making use of "done()" is not allowed together')
  })
})

test('throw exception when test is an async function and making use of done', function (assert) {
  assert.plan(1)
  const test = new Test('dummy', async function (assert, done) {
  })
  test
  .run()
  .catch((error) => {
    assert.equal(error.message, 'Method overload, async functions and making use of "done()" is not allowed together')
  })
})
