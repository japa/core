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
const Runner = require('../src/Runner')
const Test = require('../src/Test')
const emitter = require('../lib/emitter')

const cleanup = function () {
  emitter.eventNames().forEach((event) => {
    emitter.removeAllListeners(event)
  })
}

test('add a test to the default group', function (assert) {
  const runner = new Runner()
  assert.plan(2)
  const addedTest = runner.test('this is test', function () {})
  assert.equal(addedTest instanceof Test, true)
  assert.deepEqual(runner.getGroups()[0]._tests[0], addedTest)
  cleanup()
})

test('add a test to the newly created group', function (assert) {
  const runner = new Runner()
  assert.plan(2)
  let addedTest = null
  runner.group('Dummy group', () => {
    addedTest = runner.test('this is test', function () {})
  })
  assert.equal(addedTest instanceof Test, true)
  assert.deepEqual(runner.getGroups()[1]._tests[0], addedTest)
  cleanup()
})

test('add a test to the newly created default group after a named group', function (assert) {
  const runner = new Runner()
  assert.plan(4)
  let groupTest = null
  runner.group('Dummy group', () => {
    groupTest = runner.test('this is test', function () {})
  })

  const addedTest = runner.test('Foo', function () {})

  assert.equal(addedTest instanceof Test, true)
  assert.deepEqual(runner.getGroups()[2]._tests[0], addedTest)
  assert.equal(groupTest instanceof Test, true)
  assert.deepEqual(runner.getGroups()[1]._tests[0], groupTest)
  cleanup()
})

test('run all tests in a group and in default group in sequence', function (assert) {
  const runner = new Runner()
  assert.plan(1)

  const testsStack = []

  emitter.on('group:start', function (stats) {
    testsStack.push(stats.title)
  })

  emitter.on('group:end', function (stats) {
    testsStack.push(stats.title)
  })

  emitter.on('test:end', function (stats) {
    testsStack.push(stats.title)
  })

  runner.group('Foo', function () {
    runner.test('a foo foo', function () {})
    runner.test('a foo bar', function () {})
  })

  runner.test('a foo', function () {})
  runner.test('a bar', function () {})

  runner
  .run()
  .then(() => {
    assert.deepEqual(testsStack, ['Foo', 'a foo foo', 'a foo bar', 'Foo', 'a foo', 'a bar'])
    cleanup()
  })
})

test('run all async tests in a group and in default group in sequence', function (assert) {
  const runner = new Runner()
  assert.plan(1)

  const testsStack = []

  emitter.on('group:start', function (stats) {
    testsStack.push(stats.title)
  })

  emitter.on('group:end', function (stats) {
    testsStack.push(stats.title)
  })

  emitter.on('test:end', function (stats) {
    testsStack.push(stats.title)
  })

  runner.group('Foo', function () {
    runner.test('a foo foo', function () {
      return new Promise((resolve) => {
        resolve()
      })
    })
    runner.test('a foo bar', function () {
      return new Promise((resolve) => {
        resolve()
      })
    })
  })

  runner.test('a foo', function () {
    return new Promise((resolve) => {
      resolve()
    })
  })

  runner.test('a bar', function () {
    return new Promise((resolve) => {
      resolve()
    })
  })

  runner
  .run()
  .then(() => {
    assert.deepEqual(testsStack, ['Foo', 'a foo foo', 'a foo bar', 'Foo', 'a foo', 'a bar'])
    cleanup()
  })
})

test('run a skippable test', function (assert) {
  const runner = new Runner()
  assert.plan(2)
  const testsStack = []
  emitter.on('test:end', function (stats) {
    testsStack.push(stats)
  })

  runner.skip('Foo', function () {})

  runner.run().then(() => {
    assert.equal(testsStack[0].title, 'Foo')
    assert.equal(testsStack[0].status, 'skipped')
  })
})

test('do not emit hooks event when not defined', function (assert) {
  const runner = new Runner()
  assert.plan(1)
  const eventsStack = []

  emitter.on('hook:before:start', function () {
    eventsStack.push('hook:before:start')
  })

  emitter.on('hook:before:end', function () {
    eventsStack.push('hook:before:end')
  })

  emitter.on('hook:after:start', function () {
    eventsStack.push('hook:after:start')
  })

  emitter.on('hook:after:end', function () {
    eventsStack.push('hook:after:end')
  })

  runner.run().then(() => {
    assert.deepEqual(eventsStack, [])
    cleanup()
  })
})

test('do not emit hooks events when not defined but their is a test', function (assert) {
  const runner = new Runner()
  assert.plan(1)
  const eventsStack = []

  emitter.on('hook:before:start', function () {
    eventsStack.push('hook:before:start')
  })

  emitter.on('hook:before:end', function () {
    eventsStack.push('hook:before:end')
  })

  emitter.on('hook:after:start', function () {
    eventsStack.push('hook:after:start')
  })

  emitter.on('hook:after:end', function () {
    eventsStack.push('hook:after:end')
  })

  emitter.on('test:start', function () {
    eventsStack.push('test:start')
  })

  emitter.on('test:end', function () {
    eventsStack.push('test:end')
  })

  runner.test('new test', function () {})

  runner.run().then(() => {
    assert.deepEqual(eventsStack, ['test:start', 'test:end'])
    cleanup()
  })
})

test('do emit group events when even a single test is defined', function (assert) {
  const runner = new Runner()
  assert.plan(1)
  const eventsStack = []

  emitter.on('group:start', function () {
    eventsStack.push('group:start')
  })

  emitter.on('group:end', function () {
    eventsStack.push('group:end')
  })

  emitter.on('test:start', function () {
    eventsStack.push('test:start')
  })

  emitter.on('test:end', function () {
    eventsStack.push('test:end')
  })

  runner.group('Sample group', function () {
    runner.test('new test', function () {})
  })

  runner.run().then(() => {
    assert.deepEqual(eventsStack, ['group:start', 'test:start', 'test:end', 'group:end'])
    cleanup()
  })
})

test('do emit group hook events when they are defined', function (assert) {
  const runner = new Runner()
  assert.plan(1)
  const eventsStack = []

  emitter.on('group:start', function () {
    eventsStack.push('group:start')
  })

  emitter.on('group:end', function () {
    eventsStack.push('group:end')
  })

  emitter.on('hook:before:start', function () {
    eventsStack.push('hook:before:start')
  })

  emitter.on('hook:before:end', function () {
    eventsStack.push('hook:before:end')
  })

  emitter.on('test:start', function () {
    eventsStack.push('test:start')
  })

  emitter.on('test:end', function () {
    eventsStack.push('test:end')
  })

  runner.group('Sample group', function (group) {
    group.before(function () {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
    })

    runner.test('new test', function () {})
  })

  runner.run().then(() => {
    assert.deepEqual(eventsStack, ['group:start', 'hook:before:start', 'hook:before:end', 'test:start', 'test:end', 'group:end'])
    cleanup()
  })
})

test('set global timeout for all tests', function (assert) {
  const runner = new Runner()
  assert.plan(2)
  runner.timeout(10)
  const start = new Date()
  runner.test('this is test', function (assert, done) {})
  runner
  .run()
  .catch((error) => {
    assert.equal(new Date() - start < 20, true)
    assert.equal(error[0].error.message, 'Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    cleanup()
  })
})

test('should run all tests even when the previous group fails', function (assert) {
  const runner = new Runner()
  assert.plan(2)
  const testsStack = []

  runner.group('group1', function () {
    runner.test('this is test', function (assert, done) {})
  })

  runner.group('group2', function () {
    runner.test('this is test 2', function (assert) {})
  })

  emitter.on('test:end', function (stats) {
    testsStack.push(stats.title)
  })

  runner
  .run()
  .catch((error) => {
    assert.deepEqual(testsStack, ['this is test', 'this is test 2'])
    assert.equal(error[0].error.message, 'Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    cleanup()
  })
})

test('should break when a group fails and bail is true', function (assert) {
  const runner = new Runner()
  runner.bail(true)
  assert.plan(2)
  const testsStack = []

  runner.group('group1', function () {
    runner.test('this is test', function (assert, done) {})
  })

  runner.group('group2', function () {
    runner.test('this is test 2', function (assert) {})
  })

  emitter.on('test:end', function (stats) {
    testsStack.push(stats.title)
  })

  runner
  .run()
  .catch((error) => {
    assert.deepEqual(testsStack, ['this is test'])
    assert.equal(error[0].error.message, 'Test timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    cleanup()
  })
})

test('should pass when test is marked failing and does fails', function (assert) {
  const runner = new Runner()
  assert.plan(2)
  const testsStack = []

  emitter.on('test:end', (stats) => {
    testsStack.push(stats)
  })

  runner.failing('this is test', function (assert) {
    throw new Error('I failed but passed')
  })

  runner
  .run()
  .then(() => {
    assert.equal(testsStack[0].regression, true)
    assert.equal(testsStack[0].regressionMessage, 'I failed but passed')
    cleanup()
  })
})

test('should be able to grep on tests and run only matching tests', function (assert) {
  const runner = new Runner()
  assert.plan(1)
  const testsStack = []

  emitter.on('test:end', (stats) => {
    testsStack.push(stats.title)
  })

  runner.grep('foo')

  runner.test('bar', function () {})
  runner.test('foo', function () {})
  runner.test('ohhh foo', function () {})

  runner
  .run()
  .then(() => {
    assert.deepEqual(testsStack, ['foo', 'ohhh foo'])
    cleanup()
  })
})

test('should be able to grep on tests inside groups and run only matching tests', function (assert) {
  const runner = new Runner()
  assert.plan(1)
  const testsStack = []

  emitter.on('test:end', (stats) => {
    testsStack.push(stats.title)
  })

  runner.grep('foo')

  runner.group('foo', function () {
    runner.test('bar', function () {})
    runner.test('ohhh foo', function () {})
  })

  runner.group('bar', function () {
    runner.test('foo', function () {})
  })

  runner
  .run()
  .then(() => {
    assert.deepEqual(testsStack, ['ohhh foo', 'foo'])
    cleanup()
  })
})
