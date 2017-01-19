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
const Group = require('../src/Group')
const Hook = require('../src/Hook')
const Test = require('../src/Test')
const emitter = require('../lib/emitter')

const cleanup = function () {
  emitter.eventNames().forEach((event) => {
    emitter.removeAllListeners(event)
  })
}

test('add before hook to the module', function (assert) {
  assert.plan(1)
  const group = new Group()
  group.before(function () {})
  assert.equal(group._hooks.before[0] instanceof Hook, true)
})

test('add beforeEach hook to the module', function (assert) {
  assert.plan(1)
  const group = new Group()
  group.beforeEach(function () {})
  assert.equal(group._hooks.beforeEach[0] instanceof Hook, true)
})

test('add after hook to the module', function (assert) {
  assert.plan(1)
  const group = new Group()
  group.after(function () {})
  assert.equal(group._hooks.after[0] instanceof Hook, true)
})

test('add afterEach hook to the module', function (assert) {
  assert.plan(1)
  const group = new Group()
  group.afterEach(function () {})
  assert.equal(group._hooks.afterEach[0] instanceof Hook, true)
})

test('compose tests by placing beforeEach hook before each test', function (assert) {
  assert.plan(1)
  const group = new Group()

  group.beforeEach(function () {})
  const test = new Test('test foo', function () {})
  group.addTest(test)
  const composedTests = group._composeStack()
  assert.equal(composedTests.length, 2)
})

test('compose tests by placing all hooks in order', function (assert) {
  assert.plan(1)
  const group = new Group()

  group.before(function () {})
  group.after(function () {})
  group.afterEach(function () {})
  group.beforeEach(function () {})
  const test = new Test('test foo', function () {})
  const test1 = new Test('test foo', function () {})
  group.addTest(test)
  group.addTest(test1)
  const composedTests = group._composeStack()
  assert.equal(composedTests.length, 8)
})

test('compose tests as a middleware chain', function (assert) {
  assert.plan(1)
  const testsStack = []
  const testFoo = new Test('foo', function () {
    return new Promise((resolve) => {
      setTimeout(() => {
        testsStack.push('foo')
        resolve()
      }, 10)
    })
  })

  const testBar = new Test('bar', function () {
    testsStack.push('bar')
  })

  const group = new Group()
  group.addTest(testFoo)
  group.addTest(testBar)

  group
  .middleware.compose(group._composeStack())()
  .then(() => {
    assert.deepEqual(testsStack, ['foo', 'bar'])
  })
})

test('run tests by executing hooks in order', (assert) => {
  assert.plan(1)
  const group = new Group()
  const testsStack = []

  group.before(function () {
    testsStack.push('before')
  })

  group.after(function () {
    testsStack.push('after')
  })

  group.afterEach(function () {
    testsStack.push('afterEach')
  })

  group.beforeEach(function () {
    testsStack.push('beforeEach')
  })

  const test = new Test('test foo', function () {
    testsStack.push('test1')
  })

  const test1 = new Test('test foo', function () {
    testsStack.push('test2')
  })

  group.addTest(test)
  group.addTest(test1)

  group
  .run()
  .then(() => {
    assert.deepEqual(testsStack, [
      'before',
      'beforeEach',
      'test1',
      'afterEach',
      'beforeEach',
      'test2',
      'afterEach',
      'after'
    ])
  })
})

test('emit event for each hook and corresponding test title', (assert) => {
  assert.plan(1)
  const group = new Group('Module A')
  const eventsStack = []

  group.before(function () {})
  group.after(function () {})
  group.afterEach(function () {})
  group.beforeEach(function () {})
  const test = new Test('test foo', function () {})
  const test1 = new Test('test bar', function () {})

  group.addTest(test)
  group.addTest(test1)

  emitter.on('hook:before:end', function (stats) {
    eventsStack.push('hook:before:end')
  })

  emitter.on('test:end', function (stats) {
    eventsStack.push(stats.title)
  })

  emitter.on('hook:after:end', function (stats) {
    eventsStack.push('hook:after:end')
  })

  emitter.on('hook:beforeEach:end', function (stats) {
    eventsStack.push('hook:beforeEach:end')
  })

  emitter.on('hook:afterEach:end', function (stats) {
    eventsStack.push('hook:afterEach:end')
  })

  group
  .run()
  .then(() => {
    assert.deepEqual(eventsStack, [
      'hook:before:end',
      'hook:beforeEach:end',
      'test foo',
      'hook:afterEach:end',
      'hook:beforeEach:end',
      'test bar',
      'hook:afterEach:end',
      'hook:after:end'
    ])
    cleanup()
  })
})

test('throw timeout error when before test timeouts', function (assert) {
  assert.plan(2)
  const group = new Group('Sample')

  group.before(function (done) {}).timeout(10)
  group.after(function () {})
  group.afterEach(function () {})
  group.beforeEach(function () {})
  const test = new Test('test foo', function () {})
  const test1 = new Test('test foo', function () {})
  group.addTest(test)
  group.addTest(test1)

  group
  .run()
  .catch((error) => {
    assert.equal(error[0].title, 'Sample')
    assert.equal(error[0].error.message, 'Hook timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    cleanup()
  })
})

test('run all tests even when a hook fails', function (assert) {
  assert.plan(3)
  const group = new Group('Sample')
  const testsStack = []

  group.before(function (done) {}).timeout(10)
  group.after(function () {
    testsStack.push('after')
  })

  group.afterEach(function () {
    testsStack.push('afterEach')
  })

  group.beforeEach(function () {
    testsStack.push('beforeEach')
  })

  const test = new Test('test foo', function () {
    testsStack.push('test foo')
  })

  const test1 = new Test('test bar', function () {
    testsStack.push('test bar')
  })

  group.addTest(test)
  group.addTest(test1)

  group
  .run()
  .catch((error) => {
    assert.equal(error[0].title, 'Sample')
    assert.equal(error[0].error.message, 'Hook timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    assert.deepEqual(testsStack, [
      'beforeEach',
      'test foo',
      'afterEach',
      'beforeEach',
      'test bar',
      'afterEach',
      'after'
    ])
    cleanup()
  })
})

test('stop after first error when bail is true', function (assert) {
  assert.plan(3)
  const group = new Group('A', true)
  const testsStack = []

  group.before(function (done) {})
  group.after(function () {
    testsStack.push('after')
  })

  group.afterEach(function () {
    testsStack.push('afterEach')
  })

  group.beforeEach(function () {
    testsStack.push('beforeEach')
  })

  const test = new Test('test foo', function () {
    testsStack.push('test foo')
  })

  const test1 = new Test('test bar', function () {
    testsStack.push('test bar')
  })

  group.addTest(test)
  group.addTest(test1)

  group
  .run()
  .catch((error) => {
    assert.equal(error[0].title, 'A')
    assert.equal(error[0].error.message, 'Hook timeout, ensure "done()" is called; if returning a Promise, ensure it resolves.')
    assert.deepEqual(testsStack, [])
    cleanup()
  })
})

test('do not emit events for a root level group', function (assert) {
  assert.plan(1)
  const group = new Group('Default group', false, true)
  const groupEvents = []

  emitter.on('group:start', function () {
    groupEvents.push('group:start')
  })

  emitter.on('group:end', function () {
    groupEvents.push('group:end')
  })

  emitter.on('hook:before:start', function () {
    groupEvents.push('hook:before:start')
  })

  emitter.on('hook:before:end', function () {
    groupEvents.push('hook:before:end')
  })

  emitter.on('test:start', function () {
    groupEvents.push('test:start')
  })

  emitter.on('test:end', function () {
    groupEvents.push('test:end')
  })

  const test = new Test('test foo', function () {})
  group.addTest(test)

  group
  .run()
  .then(() => {
    assert.deepEqual(groupEvents, ['test:start', 'test:end'])
    cleanup()
  })
})
