'use strict'

const test = require('../index')
const StringCalculator = require('./code/StringCalculator')

test.group('String Calculator', (group) => {
  group.beforeEach(() => {
    this.calculator = new StringCalculator()
  })

  test('returns 0 for the empty string', (assert) => {
    assert.equal(this.calculator.add(), 0)
  })

  test('returns the sum of one number', (assert) => {
    assert.equal(this.calculator.add('5'), 5)
  })

  test('returns the sum of two number', (assert) => {
    assert.equal(this.calculator.add('3,2'), 5)
  })

  test('returns the sum of any amount of numbers', (assert) => {
    assert.equal(this.calculator.add('3,2,8,10'), 23)
  })

  test('throws expection when number is negative', (assert) => {
    const fn = () => this.calculator.add('3,-2')
    assert.throws(fn, '-2 is not allowed.')
  })

  test('returns the sum of numbers before 1000 is hit', (assert) => {
    assert.equal(this.calculator.add('3,2,8,10,1000'), 23)
  })

  test('returns the sum of numbers even if their are numbers after 1000', (assert) => {
    assert.equal(this.calculator.add('3,2,8,10,1000,5'), 28)
  })

  test('returns the sum of number if delimited with a new line', (assert) => {
    assert.equal(this.calculator.add('3,2\n8'), 13)
  })

  test.failing('Some regression here', (assert) => {
    assert.fail(2, 4, 'Expected 2 to be equal to 2 but got 4')
  })

  test.skip('I will be skipped', (assert) => {})
})
