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

const cleanup = function () {
  Runner.clear()
  Runner.eventNames().forEach((event) => {
    Runner.removeAllListeners(event)
  })
}

test('add a test to the default group', function (assert) {
  assert.plan(2)
  const addedTest = Runner.test('this is test', function () {})
  assert.equal(addedTest instanceof Test, true)
  assert.deepEqual(Runner.getGroups()[0]._tests[0], addedTest)
  cleanup()
})

test('add a test to the newly created group', function (assert) {
  assert.plan(2)
  let addedTest = null
  Runner.group('Dummy group', () => {
    addedTest = Runner.test('this is test', function () {})
  })
  assert.equal(addedTest instanceof Test, true)
  assert.deepEqual(Runner.getGroups()[1]._tests[0], addedTest)
  cleanup()
})

test('add a test to the newly created default group after a named group', function (assert) {
  assert.plan(4)
  let groupTest = null
  Runner.group('Dummy group', () => {
    groupTest = Runner.test('this is test', function () {})
  })

  const addedTest = Runner.test('Foo', function () {})

  assert.equal(addedTest instanceof Test, true)
  assert.deepEqual(Runner.getGroups()[2]._tests[0], addedTest)
  assert.equal(groupTest instanceof Test, true)
  assert.deepEqual(Runner.getGroups()[1]._tests[0], groupTest)
  cleanup()
})

test('run all tests in a group and in default group in sequence', function (assert) {
  assert.plan(1)

  const testsStack = []

  Runner.on('group:start', function (stats) {
    testsStack.push(stats.title)
  })

  Runner.on('group:end', function (stats) {
    testsStack.push(stats.title)
  })

  Runner.on('test:end', function (stats) {
    testsStack.push(stats.title)
  })

  Runner.group('Foo', function () {
    Runner.test('a foo foo', function () {})
    Runner.test('a foo bar', function () {})
  })

  Runner.test('a foo', function () {})
  Runner.test('a bar', function () {})

  Runner
  .run()
  .then(() => {
    assert.deepEqual(testsStack, ['Foo', 'a foo foo', 'a foo bar', 'Foo', 'a foo', 'a bar'])
    cleanup()
  })
})

test('run all async tests in a group and in default group in sequence', function (assert) {
  assert.plan(1)

  const testsStack = []

  Runner.on('group:start', function (stats) {
    testsStack.push(stats.title)
  })

  Runner.on('group:end', function (stats) {
    testsStack.push(stats.title)
  })

  Runner.on('test:end', function (stats) {
    testsStack.push(stats.title)
  })

  Runner.group('Foo', function () {
    Runner.test('a foo foo', function () {
      return new Promise((resolve) => {
        resolve()
      })
    })
    Runner.test('a foo bar', function () {
      return new Promise((resolve) => {
        resolve()
      })
    })
  })

  Runner.test('a foo', function () {
    return new Promise((resolve) => {
      resolve()
    })
  })

  Runner.test('a bar', function () {
    return new Promise((resolve) => {
      resolve()
    })
  })

  Runner
  .run()
  .then(() => {
    assert.deepEqual(testsStack, ['Foo', 'a foo foo', 'a foo bar', 'Foo', 'a foo', 'a bar'])
    cleanup()
  })
})

test('run a skippable test', function (assert) {
  assert.plan(2)
  const testsStack = []
  Runner.on('test:end', function (stats) {
    testsStack.push(stats)
  })

  Runner.test.skip('Foo', function () {})

  Runner.run().then(() => {
    assert.equal(testsStack[0].title, 'Foo')
    assert.equal(testsStack[0].status, 'skipped')
  })
})

test('do not emit hooks event when not defined', function (assert) {
  assert.plan(1)
  const eventsStack = []

  Runner.on('hook:before:start', function () {
    eventsStack.push('hook:before:start')
  })

  Runner.on('hook:before:end', function () {
    eventsStack.push('hook:before:end')
  })

  Runner.on('hook:after:start', function () {
    eventsStack.push('hook:after:start')
  })

  Runner.on('hook:after:end', function () {
    eventsStack.push('hook:after:end')
  })

  Runner.run().then(() => {
    assert.deepEqual(eventsStack, [])
    cleanup()
  })
})

test('do not emit hooks events when not defined but their is a test', function (assert) {
  assert.plan(1)
  const eventsStack = []

  Runner.on('hook:before:start', function () {
    eventsStack.push('hook:before:start')
  })

  Runner.on('hook:before:end', function () {
    eventsStack.push('hook:before:end')
  })

  Runner.on('hook:after:start', function () {
    eventsStack.push('hook:after:start')
  })

  Runner.on('hook:after:end', function () {
    eventsStack.push('hook:after:end')
  })

  Runner.on('test:start', function () {
    eventsStack.push('test:start')
  })

  Runner.on('test:end', function () {
    eventsStack.push('test:end')
  })

  Runner.test('new test', function () {})

  Runner.run().then(() => {
    assert.deepEqual(eventsStack, ['test:start', 'test:end'])
    cleanup()
  })
})

test('do emit group events when even a single test is defined', function (assert) {
  assert.plan(1)
  const eventsStack = []

  Runner.on('group:start', function () {
    eventsStack.push('group:start')
  })

  Runner.on('group:end', function () {
    eventsStack.push('group:end')
  })

  Runner.on('test:start', function () {
    eventsStack.push('test:start')
  })

  Runner.on('test:end', function () {
    eventsStack.push('test:end')
  })

  Runner.group('Sample group', function () {
    Runner.test('new test', function () {})
  })

  Runner.run().then(() => {
    assert.deepEqual(eventsStack, ['group:start', 'test:start', 'test:end', 'group:end'])
    cleanup()
  })
})

test('do emit group hook events when they are defined', function (assert) {
  assert.plan(1)
  const eventsStack = []

  Runner.on('group:start', function () {
    eventsStack.push('group:start')
  })

  Runner.on('group:end', function () {
    eventsStack.push('group:end')
  })

  Runner.on('hook:before:start', function () {
    eventsStack.push('hook:before:start')
  })

  Runner.on('hook:before:end', function () {
    eventsStack.push('hook:before:end')
  })

  Runner.on('test:start', function () {
    eventsStack.push('test:start')
  })

  Runner.on('test:end', function () {
    eventsStack.push('test:end')
  })

  Runner.group('Sample group', function (group) {
    group.before(function () {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
    })

    Runner.test('new test', function () {})
  })

  Runner.run().then(() => {
    assert.deepEqual(eventsStack, ['group:start', 'hook:before:start', 'hook:before:end', 'test:start', 'test:end', 'group:end'])
    cleanup()
  })
})

test('set global timeout for all tests', function (assert) {
  assert.plan(2)
  Runner.timeout(10)
  const start = new Date()
  Runner.test('this is test', function (assert, done) {})
  Runner
  .run()
  .catch((error) => {
    assert.equal(new Date() - start < 20, true)
    assert.equal(error[0].error.message, 'Test timeout, make sure to call done() or increase timeout')
    cleanup()
  })
})
