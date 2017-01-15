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

test('{_needsDone} should be true when fn accepts done', function (assert) {
  assert.plan(1)
  const fn = function (done) {}
  const callable = new Callable(fn, 2000, 0)
  assert.equal(callable._needsDone, true)
})

test('throw exception when timeout is not a number', function (assert) {
  assert.plan(1)
  const fn = function (done) {}
  try {
    /* eslint no-new: "off" */
    new Callable(fn, null, 0)
  } catch (error) {
    assert.equal(error.message, 'Make sure timeout is in milliseconds as a number')
  }
})

test('disable timeouts when timeout is 0', function (assert) {
  assert.plan(1)
  const fn = function (done) {}
  const callable = new Callable(fn, 0, 0)
  assert.equal(callable._enableTimeouts, false)
})

test('disable timeouts when timeout is too big', function (assert) {
  assert.plan(1)
  const fn = function (done) {}
  const callable = new Callable(fn, Math.pow(2, 31) + 1, 0)
  assert.equal(callable._enableTimeouts, false)
})

test('set default timeout to 2000 when timeout is not defined', function (assert) {
  assert.plan(2)
  const fn = function (done) {}
  const callable = new Callable(fn, 2000, 0)
  assert.equal(callable._enableTimeouts, true)
  assert.equal(callable._timeout, 2000)
})

test('override timeout when defined', function (assert) {
  assert.plan(2)
  const fn = function (done) {}
  const callable = new Callable(fn, 1000, 0)
  assert.equal(callable._enableTimeouts, true)
  assert.equal(callable._timeout, 1000)
})

test('reject function when promise hangs for more than the given timeout', function (assert) {
  assert.plan(1)
  const fn = function () {
    return new Promise((resolve) => {
      setTimeout(function () {
        resolve()
      }, 300)
    })
  }
  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'TIMEOUT')
  })
})

test('reject function when async method hangs for more than the given timeout', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    setTimeout(function () {
      done()
    }, 300)
  }
  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'TIMEOUT')
  })
})

test('throw exception when returns and calls a promise and accepts done', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    return new Promise(() => {
      done()
    })
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'METHOD OVERLOAD:PROMISE')
  })
})

test('throw exception when returns a promise and never calls done', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    return new Promise(() => {
    })
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'METHOD OVERLOAD:PROMISE')
  })
})

test('throw exception when returns a promise and calls done after a while', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    return new Promise(() => {
      setTimeout(function () {
        done()
      }, 20)
    })
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'METHOD OVERLOAD:PROMISE')
  })
})

test('throw exception done receives an error', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    setTimeout(function () {
      done('custom error')
    }, 20)
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'custom error')
  })
})

test('throw exception when sync error has been thrown', function (assert) {
  assert.plan(1)
  const fn = function () {
    throw new Error('custom foo error')
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error.message, 'custom foo error')
  })
})

test('throw exception when promise rejects', function (assert) {
  assert.plan(1)
  const fn = function () {
    return new Promise((resolve, reject) => {
      reject('custom rejection')
    })
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'custom rejection')
  })
})

test('return early when is sync and does a timeout', function (assert) {
  assert.plan(1)
  let methodCalled = false
  const fn = function () {
    setTimeout(function () {
      methodCalled = true
    })
  }

  const callable = new Callable(fn, 100, 0)
  callable
  .run()
  .then(() => {
    assert.equal(methodCalled, false)
  })
})

test('throw exception when done called twice', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    done()
    done()
  }

  const callable = new Callable(fn, 0, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'DONE CALLED TWICE')
  })
})

test('throw exception thrown within the then method over done called twice', function (assert) {
  assert.plan(1)
  const fn = function (done) {
    done('custom foo')
    done()
  }

  const callable = new Callable(fn, 0, 0)
  callable
  .run()
  .catch((error) => {
    assert.equal(error, 'custom foo')
  })
})

test('do not override function scope', function (assert) {
  assert.plan(1)
  let ctx = null
  class Foo {
    fn () {
      ctx = this
    }
  }

  const fooInstance = new Foo()
  const callable = new Callable(fooInstance.fn.bind(fooInstance), 0, 0)
  callable
  .run()
  .then(() => {
    assert.deepEqual(fooInstance, ctx)
  })
})

test('pass custom args to the function', function (assert) {
  assert.plan(1)
  let args = []
  const fn = function (name, age, done) {
    args.push(name)
    args.push(age)
    done()
  }

  const callable = new Callable(fn, 0, 2)
  callable
  .args(['virk', 22])
  .run()
  .then(() => {
    assert.deepEqual(args, ['virk', 22])
  })
})
