'use strict'

const test = require('../index')
const FizzBuzz = require('./code/FizzBuzz')

test.group('Fizz Buzz', (group) => {
  group.beforeEach(() => {
    this.fizzbuzz = new FizzBuzz()
  })

  test('return 1 when 1 is passed', (assert) => {
    assert.equal(this.fizzbuzz.execute(1), 1)
  })

  test('return fizz when number is divisible by 3', (assert) => {
    assert.equal(this.fizzbuzz.execute(3), 'fizz')
  })

  test('return 4 when number is 4', (assert) => {
    assert.equal(this.fizzbuzz.execute(4), 4)
  })

  test('return buzz when number is 5', (assert) => {
    assert.equal(this.fizzbuzz.execute(5), 'buzz')
  })

  test('return fizz when number is 9', (assert) => {
    assert.equal(this.fizzbuzz.execute(9), 'fizz')
  })

  test('return fizzbuzz when number is divisible by 3 and 5 both', (assert) => {
    assert.equal(this.fizzbuzz.execute(15), 'fizzbuzz')
  })

  test('return fizzbuzz when number is 30', (assert) => {
    assert.equal(this.fizzbuzz.execute(30), 'fizzbuzz')
  })
})
