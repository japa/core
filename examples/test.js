'use strict'

const test = require('../index')

test.group('Fancy group', function () {
  test('assert equals', function (assert) {
    assert.plan(2)
    assert.equal(10, 10)
  })
})

test.group('Fancy group2', function () {
  test('assert equals group 2', function (assert) {
    console.dir('hello')
    assert.plan(1)
    assert.equal(10, 10)
  })
})
