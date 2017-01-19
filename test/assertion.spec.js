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
const Assertion = require('../src/Assertion')

test('assert the values using chai.assert', function (t) {
  const assertion = new Assertion()
  assertion.equal(true, true)
  assertion.deepEqual({}, {})
  t.end()
})

test('assert the values using chai.assert and increment ran counter', function (t) {
  t.plan(1)
  const assertion = new Assertion()
  assertion.equal(true, true)
  assertion.deepEqual({}, {})
  t.equal(assertion._ran, 2)
})

test('set planned property when plan method is used', function (t) {
  t.plan(1)
  const assertion = new Assertion()
  assertion.plan(1)
  t.equal(assertion._planned, 1)
})

test('pass when no tests were planned', function (t) {
  const assertion = new Assertion()
  assertion.evaluate()
  t.end()
})

test('throw exception when plan nums is not a number', function (t) {
  t.plan(1)
  const assertion = new Assertion()
  try {
    assertion.plan('foo')
  } catch (error) {
    t.equal(error.message, 'Planned assertions should be valid number')
  }
})

test('fail when tests were planned but not asserted', function (t) {
  t.plan(1)
  const assertion = new Assertion()
  assertion.plan(1)
  try {
    assertion.evaluate()
  } catch (error) {
    t.equal(error.message, 'planned for 1 assertion but ran 0')
  }
})

test('fail when tests were more assertions are made than the planned assertions', function (t) {
  t.plan(1)
  const assertion = new Assertion()
  assertion.plan(1)
  assertion.equal(1, 1)
  assertion.equal(2, 2)
  try {
    assertion.evaluate()
  } catch (error) {
    t.equal(error.message, 'planned for 1 assertion but ran 2')
  }
})

test('pass when assertion counts are 0 and ran 1', function (t) {
  const assertion = new Assertion()
  assertion.plan(0)
  assertion.equal(2, 2)
  assertion.evaluate()
  t.end()
})

test('fail when ran assertions are less than planned assertions', function (t) {
  t.plan(1)
  const assertion = new Assertion()
  assertion.plan(2)
  assertion.equal(2, 2)
  try {
    assertion.evaluate()
  } catch (error) {
    t.equal(error.message, 'planned for 2 assertions but ran 1')
  }
})
