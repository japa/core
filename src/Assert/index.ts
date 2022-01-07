/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { assert, Assertion, AssertionError } from 'chai'

import { subsetCompare } from './utils'
import { AssertContract, ChaiAssert } from '../Contracts'

/**
 * The Assert class is derived from chai.assert to allow support
 * for additional assertion methods and assertion planning.
 *
 * Also some of the methods from chai.assert are not available
 * and some additional methods have been added.
 *
 * @example
 * const assert = new Assert()
 * assert.deepEqual({ id: 1 }, { id: 1 })
 */
export class Assert implements AssertContract {
  /**
   * Tracking assertions
   */
  public assertions: {
    planned?: number
    total: number
    validate(): void
  } = {
    total: 0,
    validate() {
      if (this.planned === undefined) {
        return
      }

      if (this.planned !== this.total) {
        const suffix = this.planned === 1 ? '' : 's'
        const message = `Planned for ${this.planned} assertion${suffix}, but ran ${this.total}`
        throw new AssertionError(message)
      }
    },
  }

  public Assertion = Assertion
  public AssertionError = AssertionError

  /**
   * Converts a luxon date to JavaScript date
   */
  private luxonToJSDate(value?: any) {
    if (typeof value?.toJSDate === 'function') {
      return value.toJSDate()
    }
    return value
  }

  /**
   * Increments the assertions count by 1
   */
  private incrementAssertionsCount() {
    this.assertions.total += 1
  }

  /**
   * Plan assertions to expect by the end of this test
   */
  public plan(assertionsToExpect: number): this {
    this.assertions.planned = assertionsToExpect
    return this
  }

  /**
   * Evaluate an expression and raise {@link AssertionError} if expression
   * is not truthy
   */
  public evaluate(
    expression: any,
    message: string,
    stackProps: {
      actual: any
      expected: any
      operator: string
      prefix?: string
      thisObject?: any
    }
  ) {
    this.Assertion.prototype.assert.call(
      {
        __flags: {
          operator: stackProps.operator,
          message: stackProps.prefix,
          object: stackProps.thisObject,
        },
      },
      expression,
      message,
      '',
      stackProps.expected,
      stackProps.actual,
      true
    )
  }

  /**
   * Assert an expression to be truthy.
   * Optionally define the error message
   *
   * @example:
   * assert(isTrue(foo))
   * assert(foo === 'bar')
   * assert(age > 18, 'Not allowed to enter the club')
   *
   */
  public assert(expression: any, message?: string): void {
    this.incrementAssertionsCount()
    return assert(expression, message)
  }

  /**
   * Throw a failure. Optionally accepts "actual" and "expected" values for
   * the default error message.
   *
   * @note
   * The actual and expected values are not compared. They are available as
   * properties on the AssertionError.
   *
   * @example
   * assert.fail() // fail
   * assert.fail('Error message for the failure')
   * assert.fail(1, 2, 'expected 1 to equal 2')
   * assert.fail(1, 2, 'expected 1 to be greater than 2', '>')
   *
   */
  public fail(message?: string): never
  public fail<T>(actual: T, expected: T, message?: string, operator?: Chai.Operator): never
  public fail<T>(
    actual?: T | string,
    expected?: T,
    message?: string,
    operator?: Chai.Operator
  ): never {
    this.incrementAssertionsCount()
    if (arguments.length === 1 && typeof actual === 'string') {
      return assert.fail(actual)
    }

    return assert.fail(actual, expected, message, operator)
  }

  /**
   * Assert the value is truthy
   *
   * @example
   * assert.isOk({ hello: 'world' }) // passes
   * assert.isOk(null) // fails
   *
   */
  public isOk(...args: Parameters<ChaiAssert['isOk']>): ReturnType<ChaiAssert['isOk']> {
    this.incrementAssertionsCount()
    return assert.isOk(...args)
  }

  /**
   * Assert the value is truthy
   *
   * @alias
   * isOk
   *
   * @example
   * assert.ok({ hello: 'world' }) // passes
   * assert.ok(null) // fails
   *
   */
  public ok(...args: Parameters<ChaiAssert['ok']>): ReturnType<ChaiAssert['ok']> {
    this.incrementAssertionsCount()
    return assert.ok(...args)
  }

  /**
   * Assert the value is falsy
   *
   * @example
   * assert.isNotOk({ hello: 'world' }) // fails
   * assert.isNotOk(null) // passes
   *
   */
  public isNotOk(...args: Parameters<ChaiAssert['isNotOk']>): ReturnType<ChaiAssert['isNotOk']> {
    this.incrementAssertionsCount()
    return assert.isNotOk(...args)
  }

  /**
   * Assert the value is falsy
   *
   * @alias
   * isNotOk
   *
   * @example
   * assert.notOk({ hello: 'world' }) // fails
   * assert.notOk(null) // passes
   *
   */
  public notOk(...args: Parameters<ChaiAssert['notOk']>): ReturnType<ChaiAssert['notOk']> {
    this.incrementAssertionsCount()
    return assert.notOk(...args)
  }

  /**
   * Assert two values are equal but not strictly. The comparsion
   * is same as "foo == bar".
   *
   * See {@link strictEqual} for strict equality
   * See {@link deepEqual} for comparing objects and arrays
   *
   * @example
   * assert.equal(3, 3) // passes
   * assert.equal(3, '3') // passes
   * assert.equal(Symbol.for('foo'), Symbol.for('foo')) // passes
   *
   */
  public equal(...args: Parameters<ChaiAssert['equal']>): ReturnType<ChaiAssert['equal']> {
    this.incrementAssertionsCount()
    return assert.equal(...args)
  }

  /**
   * Assert two values are not equal. The comparsion
   * is same as "foo != bar".
   *
   * See @notStrictEqual for strict inequality
   * See @notDeepEqual for comparing objects and arrays
   *
   * @example
   * assert.notEqual(3, 2) // passes
   * assert.notEqual(3, '2') // passes
   * assert.notEqual(Symbol.for('foo'), Symbol.for('bar')) // passes
   *
   */
  public notEqual(...args: Parameters<ChaiAssert['notEqual']>): ReturnType<ChaiAssert['notEqual']> {
    this.incrementAssertionsCount()
    return assert.notEqual(...args)
  }

  /**
   * Assert two values are strictly equal. The comparsion
   * is same as "foo === bar".
   *
   * See @equal for non-strict equality
   * See @deepEqual for comparing objects and arrays
   *
   * @example
   * assert.equal(3, 3) // passes
   * assert.equal(3, '3') // fails
   * assert.equal(Symbol.for('foo'), Symbol.for('foo')) // passes
   */
  public strictEqual(
    ...args: Parameters<ChaiAssert['strictEqual']>
  ): ReturnType<ChaiAssert['strictEqual']> {
    this.incrementAssertionsCount()
    return assert.strictEqual(...args)
  }

  /**
   * Assert two values are not strictly equal. The comparsion
   * is same as "foo !== bar".
   *
   * See @notEqual for non-strict equality
   * See @notDeepEqual for comparing objects and arrays
   *
   * @example
   * assert.notStrictEqual(3, 2) // passes
   * assert.notStrictEqual(3, '2') // fails
   * assert.notStrictEqual(Symbol.for('foo'), Symbol.for('bar')) // passes
   */
  public notStrictEqual(
    ...args: Parameters<ChaiAssert['notStrictEqual']>
  ): ReturnType<ChaiAssert['notStrictEqual']> {
    this.incrementAssertionsCount()
    return assert.notStrictEqual(...args)
  }

  /**
   * Assert two values are deeply equal. The order of items in
   * an array should be same for the assertion to pass.
   *
   * @example
   * assert.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) // passes
   * assert.deepEqual({ b: 2, a: 1 }, { a: 1, b: 2 }) // passes
   * assert.deepEqual([1, 2], [1, 2]) // passes
   * assert.deepEqual([1, 2], [2, 1]) // fails
   * assert.deepEqual(/a/, /a/) // passes
   * assert.deepEqual(
   *   new Date('2020 01 22'),
   *   new Date('2020 01 22')
   * ) // passes
   */
  public deepEqual(
    ...args: Parameters<ChaiAssert['deepEqual']>
  ): ReturnType<ChaiAssert['deepEqual']> {
    this.incrementAssertionsCount()
    return assert.deepEqual(...args)
  }

  /**
   * Assert two values are not deeply equal.
   *
   * @example
   * assert.notDeepEqual({ a: 1, b: 2 }, { a: 1, b: '2' }) // passes
   * assert.notDeepEqual([1, 2], [2, 1]) // passes
   * assert.notDeepEqual(
   *   new Date('2020 01 22'),
   *   new Date('2020 01 23')
   * ) // passes
   */
  public notDeepEqual(
    ...args: Parameters<ChaiAssert['notDeepEqual']>
  ): ReturnType<ChaiAssert['notDeepEqual']> {
    this.incrementAssertionsCount()
    return assert.notDeepEqual(...args)
  }

  /**
   * Assert if the actual value is above the expected value. Supports
   * numbers, dates and luxon datetime object.
   *
   * @example
   * assert.isAbove(5, 2) // passes
   * assert.isAbove(new Date('2020 12 20'), new Date('2020 12 18')) // passes
   */
  public isAbove(valueToCheck: Date, valueToBeAbove: Date, message?: string): void
  public isAbove(valueToCheck: number, valueToBeAbove: number, message?: string): void
  public isAbove(
    valueToCheck: number | Date,
    valueToBeAbove: number | Date,
    message?: string
  ): ReturnType<ChaiAssert['isAbove']> {
    valueToCheck = this.luxonToJSDate(valueToCheck)
    valueToBeAbove = this.luxonToJSDate(valueToBeAbove)
    this.incrementAssertionsCount()

    return assert.isAbove(valueToCheck as number, valueToBeAbove as number, message)
  }

  /**
   * Assert if the actual value is above or same as the expected value.
   * Supports numbers, dates and luxon datetime object.
   *
   * @example
   * assert.isAtLeast(2, 2) // passes
   * assert.isAtLeast(new Date('2020 12 20'), new Date('2020 12 20')) // passes
   */
  public isAtLeast(valueToCheck: Date, valueToBeAtLeast: Date, message?: string): void
  public isAtLeast(valueToCheck: number, valueToBeAtLeast: number, message?: string): void
  public isAtLeast(
    valueToCheck: number | Date,
    valueToBeAtLeast: number | Date,
    message?: string
  ): ReturnType<ChaiAssert['isAtLeast']> {
    valueToCheck = this.luxonToJSDate(valueToCheck)
    valueToBeAtLeast = this.luxonToJSDate(valueToBeAtLeast)
    this.incrementAssertionsCount()

    return assert.isAtLeast(valueToCheck as number, valueToBeAtLeast as number, message)
  }

  /**
   * Assert if the actual value is below the expected value.
   * Supports numbers, dates and luxon datetime object.
   *
   * @example
   * assert.isBelow(2, 5) // passes
   * assert.isBelow(new Date('2020 12 20'), new Date('2020 12 24')) // passes
   */
  public isBelow(valueToCheck: Date, valueToBeBelow: Date, message?: string): void
  public isBelow(valueToCheck: number, valueToBeBelow: number, message?: string): void
  public isBelow(
    valueToCheck: number | Date,
    valueToBeBelow: number | Date,
    message?: string
  ): ReturnType<ChaiAssert['isBelow']> {
    valueToCheck = this.luxonToJSDate(valueToCheck)
    valueToBeBelow = this.luxonToJSDate(valueToBeBelow)
    this.incrementAssertionsCount()

    return assert.isBelow(valueToCheck as number, valueToBeBelow as number, message)
  }

  /**
   * Assert if the actual value is below or same as the expected value.
   * Supports numbers, dates and luxon datetime object.
   *
   * @example
   * assert.isAtMost(2, 2) // passes
   * assert.isAtMost(new Date('2020 12 20'), new Date('2020 12 20')) // passes
   */
  public isAtMost(valueToCheck: Date, valueToBeAtMost: Date, message?: string): void
  public isAtMost(valueToCheck: number, valueToBeAtMost: number, message?: string): void
  public isAtMost(
    valueToCheck: number | Date,
    valueToBeAtMost: number | Date,
    message?: string
  ): ReturnType<ChaiAssert['isAtMost']> {
    valueToCheck = this.luxonToJSDate(valueToCheck)
    valueToBeAtMost = this.luxonToJSDate(valueToBeAtMost)

    this.incrementAssertionsCount()
    return assert.isAtMost(valueToCheck as number, valueToBeAtMost as number, message)
  }

  /**
   * Assert the value is a boolean (true).
   *
   * @example
   * assert.isTrue(true) // passes
   * assert.isTrue(false) // fails
   * assert.isTrue(1) // fails
   * assert.isTrue('foo') // fails
   */
  public isTrue(...args: Parameters<ChaiAssert['isTrue']>): ReturnType<ChaiAssert['isTrue']> {
    this.incrementAssertionsCount()
    return assert.isTrue(...args)
  }

  /**
   * Assert the value is anything, but not true
   *
   * @example
   * assert.isNotTrue(true) // fails
   * assert.isNotTrue(false) // passes
   * assert.isNotTrue(1) // passes
   * assert.isNotTrue('foo') // passes
   */
  public isNotTrue(
    ...args: Parameters<ChaiAssert['isNotTrue']>
  ): ReturnType<ChaiAssert['isNotTrue']> {
    this.incrementAssertionsCount()
    return assert.isNotTrue(...args)
  }

  /**
   * Assert the value is boolean (false)
   *
   * @example
   * assert.isFalse(false) // passes
   * assert.isFalse(true) // fails
   * assert.isFalse(0) // fails
   * assert.isFalse(null) // fails
   */
  public isFalse(...args: Parameters<ChaiAssert['isFalse']>): ReturnType<ChaiAssert['isFalse']> {
    this.incrementAssertionsCount()
    return assert.isFalse(...args)
  }

  /**
   * Assert the value is anything but not false
   *
   * @example
   * assert.isNotFalse(false) // fails
   * assert.isNotFalse(true) // passes
   * assert.isNotFalse(null) // passes
   * assert.isNotFalse(undefined) // passes
   */
  public isNotFalse(
    ...args: Parameters<ChaiAssert['isNotFalse']>
  ): ReturnType<ChaiAssert['isNotFalse']> {
    this.incrementAssertionsCount()
    return assert.isNotFalse(...args)
  }

  /**
   * Assert the value is null
   *
   * @example
   * assert.isNull(null) // passes
   * assert.isNull(true) // fails
   * assert.isNull(false) // fails
   * assert.isNull('foo') // fails
   */
  public isNull(...args: Parameters<ChaiAssert['isNull']>): ReturnType<ChaiAssert['isNull']> {
    this.incrementAssertionsCount()
    return assert.isNull(...args)
  }

  /**
   * Assert the value is anything but not null
   *
   * @example
   * assert.isNotNull(null) // fails
   * assert.isNotNull(true) // passes
   * assert.isNotNull(false) // passes
   * assert.isNotNull('foo') // passes
   */
  public isNotNull(
    ...args: Parameters<ChaiAssert['isNotNull']>
  ): ReturnType<ChaiAssert['isNotNull']> {
    this.incrementAssertionsCount()
    return assert.isNotNull(...args)
  }

  /**
   * Assert the value is NaN
   *
   * @example
   * assert.isNaN(NaN) // passes
   * assert.isNaN(Number('hello')) // passes
   * assert.isNaN(true) // fails
   * assert.isNaN(false) // fails
   * assert.isNaN(null) // fails
   */
  public isNaN(...args: Parameters<ChaiAssert['isNaN']>): ReturnType<ChaiAssert['isNaN']> {
    this.incrementAssertionsCount()
    return assert.isNaN(...args)
  }

  /**
   * Assert the value is anything, but not NaN
   *
   * @example
   * assert.isNotNaN(NaN) // fails
   * assert.isNotNaN(Number('hello')) // fails
   * assert.isNotNaN(true) // passes
   * assert.isNotNaN(false) // passes
   * assert.isNotNaN(null) // passes
   */
  public isNotNaN(...args: Parameters<ChaiAssert['isNotNaN']>): ReturnType<ChaiAssert['isNotNaN']> {
    this.incrementAssertionsCount()
    return assert.isNotNaN(...args)
  }

  /**
   * Asserts the value is not "null" or "undefined"
   *
   * @example
   * assert.exists(false) // passes
   * assert.exists(0) // passes
   * assert.exists('') // passes
   * assert.exists(null) // fails
   * assert.exists(undefined) // fails
   */
  public exists(...args: Parameters<ChaiAssert['exists']>): ReturnType<ChaiAssert['exists']> {
    this.incrementAssertionsCount()
    return assert.exists(...args)
  }

  /**
   * Asserts the value is "null" or "undefined"
   *
   * @example
   * assert.notExists(null) // passes
   * assert.notExists(undefined) // passes
   * assert.notExists('') // fails
   * assert.notExists(false) // fails
   * assert.notExists(0) // fails
   */
  public notExists(
    ...args: Parameters<ChaiAssert['notExists']>
  ): ReturnType<ChaiAssert['notExists']> {
    this.incrementAssertionsCount()
    return assert.notExists(...args)
  }

  /**
   * Asserts the value is explicitly "undefined"
   *
   * @example
   * assert.isUndefined(undefined) // passes
   * assert.isUndefined(false) // fails
   * assert.isUndefined(0) // fails
   * assert.isUndefined('') // fails
   * assert.isUndefined(null) // fails
   */
  public isUndefined(
    ...args: Parameters<ChaiAssert['isUndefined']>
  ): ReturnType<ChaiAssert['isUndefined']> {
    this.incrementAssertionsCount()
    assert.isUndefined(...args)
  }

  /**
   * Asserts the value is anything, but not "undefined"
   *
   * @example
   * assert.isDefined(undefined) // fails
   * assert.isDefined(0) // passes
   * assert.isDefined(false) // passes
   * assert.isDefined('') // passes
   * assert.isDefined(null) // passes
   */
  public isDefined(
    ...args: Parameters<ChaiAssert['isDefined']>
  ): ReturnType<ChaiAssert['isDefined']> {
    this.incrementAssertionsCount()
    return assert.isDefined(...args)
  }

  /**
   * Assert the value is a function
   *
   * @example
   * assert.isFunction(function foo () {}) // passes
   * assert.isFunction(() => {}) // passes
   * assert.isFunction(class Foo {}) // passes
   */
  public isFunction(
    ...args: Parameters<ChaiAssert['isFunction']>
  ): ReturnType<ChaiAssert['isFunction']> {
    this.incrementAssertionsCount()
    return assert.isFunction(...args)
  }

  /**
   * Assert the value is not a function
   *
   * @example
   * assert.isNotFunction({}) // passes
   * assert.isNotFunction(null) // passes
   * assert.isNotFunction(() => {}) // fails
   */
  public isNotFunction(
    ...args: Parameters<ChaiAssert['isNotFunction']>
  ): ReturnType<ChaiAssert['isNotFunction']> {
    this.incrementAssertionsCount()
    return assert.isNotFunction(...args)
  }

  /**
   * Assert the value to a valid object literal
   *
   * @example
   * assert.isObject({}) // passes
   * assert.isObject(new SomeClass()) // passes
   * assert.isObject(null) // fails
   * assert.isObject([]) // fails
   */
  public isObject(...args: Parameters<ChaiAssert['isObject']>): ReturnType<ChaiAssert['isObject']> {
    this.incrementAssertionsCount()
    return assert.isObject(...args)
  }

  /**
   * Assert the value to not be an object literal
   *
   * @example
   * assert.isNotObject(null) // passes
   * assert.isNotObject([]) // passes
   * assert.isNotObject({}) // fails
   * assert.isNotObject(new SomeClass()) // fails
   */
  public isNotObject(
    ...args: Parameters<ChaiAssert['isNotObject']>
  ): ReturnType<ChaiAssert['isNotObject']> {
    this.incrementAssertionsCount()
    return assert.isNotObject(...args)
  }

  /**
   * Assert the value to be a valid array

   * @example
   * assert.isArray([]) // passes
   * assert.isArray({}) // fails
   */
  public isArray(...args: Parameters<ChaiAssert['isArray']>): ReturnType<ChaiAssert['isArray']> {
    this.incrementAssertionsCount()
    return assert.isArray(...args)
  }

  /**
   * Assert the value to not be an array

   * @example
   * assert.isNotArray([]) // fails
   * assert.isNotArray({}) // passes
   */
  public isNotArray(
    ...args: Parameters<ChaiAssert['isNotArray']>
  ): ReturnType<ChaiAssert['isNotArray']> {
    this.incrementAssertionsCount()
    return assert.isNotArray(...args)
  }

  /**
   * Assert the value to be a string literal

   * @example
   * assert.isString('') // passes
   * assert.isString(new String(true)) // passes
   * assert.isString(1) // fails
   */
  public isString(...args: Parameters<ChaiAssert['isString']>): ReturnType<ChaiAssert['isString']> {
    this.incrementAssertionsCount()
    return assert.isString(...args)
  }

  /**
   * Assert the value to not be a string literal
   *
   * @example
   * assert.isNotString(1) // passes
   * assert.isNotString('') // fails
   * assert.isNotString(new String(true)) // fails
   */
  public isNotString(
    ...args: Parameters<ChaiAssert['isNotString']>
  ): ReturnType<ChaiAssert['isNotString']> {
    this.incrementAssertionsCount()
    return assert.isNotString(...args)
  }

  /**
   * Assert the value to be a valid number
   *
   * @example
   * assert.isNumber(1) // passes
   * assert.isNumber(new Number('1')) // passes
   * assert.isNumber('1') // fails
   */
  public isNumber(...args: Parameters<ChaiAssert['isNumber']>): ReturnType<ChaiAssert['isNumber']> {
    this.incrementAssertionsCount()
    return assert.isNumber(...args)
  }

  /**
   * Assert the value to not be a valid number
   *
   * @example
   * assert.isNotNumber('1') // passes
   * assert.isNotNumber(1) // fails
   */
  public isNotNumber(
    ...args: Parameters<ChaiAssert['isNotNumber']>
  ): ReturnType<ChaiAssert['isNotNumber']> {
    this.incrementAssertionsCount()
    return assert.isNotNumber(...args)
  }

  /**
   * Assert the value to be a number and no NaN or Infinity
   *
   * @example
   * assert.isFinite(1) // passes
   * assert.isFinite(Infinity) // fails
   * assert.isFinite(NaN) // fails
   */
  public isFinite(...args: Parameters<ChaiAssert['isFinite']>): ReturnType<ChaiAssert['isFinite']> {
    this.incrementAssertionsCount()
    return assert.isFinite(...args)
  }

  /**
   * Assert the value is a boolean
   *
   * @example
   * assert.isBoolean(true) // passes
   * assert.isBoolean(false) // passes
   * assert.isBoolean(1) // fails
   */
  public isBoolean(
    ...args: Parameters<ChaiAssert['isBoolean']>
  ): ReturnType<ChaiAssert['isBoolean']> {
    this.incrementAssertionsCount()
    return assert.isBoolean(...args)
  }

  /**
   * Assert the value is anything, but not a boolean
   *
   * @example
   * assert.isNotBoolean(1) // passes
   * assert.isNotBoolean(false) // fails
   * assert.isNotBoolean(true) // fails
   */
  public isNotBoolean(
    ...args: Parameters<ChaiAssert['isNotBoolean']>
  ): ReturnType<ChaiAssert['isNotBoolean']> {
    this.incrementAssertionsCount()
    return assert.isNotBoolean(...args)
  }

  /**
   * Assert the typeof value matches the expected type
   *
   * @example
   * assert.typeOf({ foo: 'bar' }, 'object') // passes
   * assert.typeOf(['admin'], 'array') // passes
   * assert.typeOf(new Date(), 'date') // passes
   */
  public typeOf(...args: Parameters<ChaiAssert['typeOf']>): ReturnType<ChaiAssert['typeOf']> {
    this.incrementAssertionsCount()
    return assert.typeOf(...args)
  }

  /**
   * Assert the typeof value is not same as the expected type
   *
   * @example
   * assert.notTypeOf({ foo: 'bar' }, 'array') // passes
   * assert.notTypeOf(['admin'], 'string') // passes
   */
  public notTypeOf(
    ...args: Parameters<ChaiAssert['notTypeOf']>
  ): ReturnType<ChaiAssert['notTypeOf']> {
    this.incrementAssertionsCount()
    return assert.notTypeOf(...args)
  }

  /**
   * Assert value to be an instance of the expected class
   *
   * @example
   * assert.instanceOf(new User(), User) // passes
   * assert.instanceOf(new User(), Function) // fails
   *
   * class User extends BaseUser {}
   * assert.instanceOf(new User(), BaseUser) // passes
   */
  public instanceOf(
    ...args: Parameters<ChaiAssert['instanceOf']>
  ): ReturnType<ChaiAssert['instanceOf']> {
    this.incrementAssertionsCount()
    return assert.instanceOf(...args)
  }

  /**
   * Assert value to NOT be an instance of the expected
   * class
   *
   * @example
   * assert.notInstanceOf(new User(), Function) // passes
   * assert.notInstanceOf(new User(), User) // fails
   */
  public notInstanceOf(
    ...args: Parameters<ChaiAssert['notInstanceOf']>
  ): ReturnType<ChaiAssert['notInstanceOf']> {
    this.incrementAssertionsCount()
    return assert.notInstanceOf(...args)
  }

  /**
   * Assert the collection includes an item. Works for strings, arrays
   * and objects.
   *
   * See {@link this.deepInclude} for deep comparsion
   *
   * @example
   * assert.include(
   *   { id: 1, name: 'virk' },
   *   { name: 'virk' }
   * ) // passes
   *
   * assert.include([1, 2, 3], 2) // passes
   * assert.include('hello world', 'hello') // passes
   */
  public include(...args: Parameters<ChaiAssert['include']>): ReturnType<ChaiAssert['include']> {
    this.incrementAssertionsCount()
    return assert.include(...args)
  }

  /**
   * Assert the collection to NOT include an item. Works for strings,
   * arrays and objects.
   *
   * See {@link this.deepInclude} for nested object properties
   *
   * @example
   * assert.include(
   *   { id: 1, name: 'virk' },
   *   { name: 'virk' }
   * ) // passes
   *
   * assert.include([1, 2, 3], 2) // passes
   * assert.include('hello world', 'hello') // passes
   */
  public notInclude(
    ...args: Parameters<ChaiAssert['notInclude']>
  ): ReturnType<ChaiAssert['notInclude']> {
    this.incrementAssertionsCount()
    return assert.notInclude(...args)
  }

  /**
   * Assert the collection includes an item. Works for strings, arrays
   * and objects.
   *
   * @example
   * assert.deepInclude(
   *   { foo: { a: 1 }, bar: { b: 2 } },
   *   { foo: { a: 1 } }
   * ) // passes
   *
   * assert.deepInclude([1, [2], 3], [2]) // passes
   */
  public deepInclude(
    ...args: Parameters<ChaiAssert['deepInclude']>
  ): ReturnType<ChaiAssert['deepInclude']> {
    this.incrementAssertionsCount()
    return assert.deepInclude(...args)
  }

  /**
   * Assert the collection to NOT include an item. Works for strings,
   * arrays, and objects.
   *
   * @example
   * assert.notDeepInclude(
   *   { foo: { a: 1 }, bar: { b: 2 } },
   *   { foo: { a: 4 } }
   * ) // passes
   *
   * assert.deepInclude([1, [2], 3], [20]) // passes
   */
  public notDeepInclude(
    ...args: Parameters<ChaiAssert['notDeepInclude']>
  ): ReturnType<ChaiAssert['notDeepInclude']> {
    return assert.notDeepInclude(...args)
  }

  /**
   * Assert the value to match the given regular expression
   *
   * @example
   * assert.match('foobar', /^foo/) // passes
   */
  public match(...args: Parameters<ChaiAssert['match']>): ReturnType<ChaiAssert['match']> {
    return assert.match(...args)
  }

  /**
   * Assert the value to NOT match the given regular expression
   *
   * @example
   * assert.notMatch('foobar', /^foo/) // fails
   */
  public notMatch(...args: Parameters<ChaiAssert['notMatch']>): ReturnType<ChaiAssert['notMatch']> {
    return assert.notMatch(...args)
  }

  /**
   * Assert an object to contain a property
   *
   * @example
   * assert.property(
   *   { id: 1, username: 'virk' },
   *   'id'
   * ) // passes
   */
  public property(...args: Parameters<ChaiAssert['property']>): ReturnType<ChaiAssert['property']> {
    return assert.nestedProperty(...args)
  }

  /**
   * Assert an object to NOT contain a property
   *
   * @example
   * assert.notProperty(
   *   { id: 1, username: 'virk' },
   *   'email'
   * ) // passes
   */
  public notProperty(
    ...args: Parameters<ChaiAssert['notProperty']>
  ): ReturnType<ChaiAssert['notProperty']> {
    return assert.notNestedProperty(...args)
  }

  /**
   * Assert an object property to match the expected value
   *
   * Use {@link deepPropertyVal} for deep comparing the value
   *
   * @example
   * assert.propertyVal(
   *   { id: 1, username: 'virk' },
   *   'id',
   *   1
   * ) // passes
   *
   * assert.propertyVal(
   *   { user: { id: 1 } },
   *   'user',
   *   { id: 1 }
   * ) // fails
   */
  public propertyVal(
    ...args: Parameters<ChaiAssert['propertyVal']>
  ): ReturnType<ChaiAssert['propertyVal']> {
    return assert.nestedPropertyVal(...args)
  }

  /**
   * Assert an object property to NOT match the expected value
   *
   * @example
   * assert.notPropertyVal(
   *   { id: 1, username: 'virk' },
   *   'id',
   *   22
   * ) // passes
   */
  public notPropertyVal(
    ...args: Parameters<ChaiAssert['notPropertyVal']>
  ): ReturnType<ChaiAssert['notPropertyVal']> {
    return assert.notNestedPropertyVal(...args)
  }

  /**
   * Assert an object property to deeply match the expected value
   *
   * @example
   * assert.deepPropertyVal(
   *   { user: { id: 1 } },
   *   'user',
   *   { id: 1 }
   * ) // passes
   */
  public deepPropertyVal(
    ...args: Parameters<ChaiAssert['deepPropertyVal']>
  ): ReturnType<ChaiAssert['deepPropertyVal']> {
    return assert.deepNestedPropertyVal(...args)
  }

  /**
   * Assert an object property to NOT deeply match the expected value
   *
   * @example
   * assert.notDeepPropertyVal(
   *   { user: { id: 1 } },
   *   'user',
   *   { email: 'foo@bar.com' }
   * ) // passes
   */
  public notDeepPropertyVal(
    ...args: Parameters<ChaiAssert['notDeepPropertyVal']>
  ): ReturnType<ChaiAssert['notDeepPropertyVal']> {
    return assert.notDeepNestedPropertyVal(...args)
  }

  /**
   * Assert length of an array, map or set to match the expected value
   *
   * @example
   * assert.lengthOf([1, 2, 3], 3)
   * assert.lengthOf(new Map([[1],[2]]), 2)
   * assert.lengthOf('hello world', 11)
   */
  public lengthOf<
    T extends { readonly length?: number | undefined; readonly size?: number | undefined }
  >(object: T, length: number, message?: string): ReturnType<ChaiAssert['lengthOf']> {
    return assert.lengthOf(object, length, message)
  }

  /**
   * Assert the object has all of the expected properties
   *
   * @example
   * assert.properties(
   *   { username: 'virk', age: 22, id: 1 },
   *   ['id', 'age']
   * ) // passes
   */
  public properties(
    ...args: Parameters<ChaiAssert['containsAllKeys']>
  ): ReturnType<ChaiAssert['containsAllKeys']> {
    return assert.containsAllKeys(...args)
  }

  /**
   * Assert the object has any of the expected properties
   *
   * @example
   * assert.anyProperties(
   *   { username: 'virk', age: 22, id: 1 },
   *   ['id', 'name', 'dob']
   * ) // passes
   */
  public anyProperties(
    ...args: Parameters<ChaiAssert['hasAnyKeys']>
  ): ReturnType<ChaiAssert['hasAnyKeys']> {
    return assert.hasAnyKeys(...args)
  }

  /**
   * Assert the object has only the expected properties. Extra
   * properties will fail the assertion
   *
   * @example
   * assert.onlyProperties(
   *   { username: 'virk', age: 22, id: 1 },
   *   ['id', 'name', 'age']
   * ) // passes
   *
   * assert.onlyProperties(
   *   { username: 'virk', age: 22, id: 1 },
   *   ['id', 'name']
   * ) // fails
   */
  public onlyProperties(
    ...args: Parameters<ChaiAssert['hasAllKeys']>
  ): ReturnType<ChaiAssert['hasAllKeys']> {
    return assert.hasAllKeys(...args)
  }

  /**
   * Assert the object to not have any of the mentioned properties
   *
   * @example
   * assert.notAnyProperties(
   *   { id: 1, name: 'foo' },
   *   ['email', 'age']
   * ) // passes
   *
   * assert.notAnyProperties(
   *   { id: 1, name: 'foo' },
   *   ['email', 'id']
   * ) // fails
   */
  public notAnyProperties(
    ...args: Parameters<ChaiAssert['doesNotHaveAnyKeys']>
  ): ReturnType<ChaiAssert['doesNotHaveAnyKeys']> {
    return assert.doesNotHaveAnyKeys(...args)
  }

  /**
   * Assert the object to not have all of the mentioned properties
   *
   * @example
   * assert.notAllProperties(
   *   { id: 1, name: 'foo' },
   *   ['id', 'name', 'email']
   * ) // passes
   */
  public notAllProperties(
    ...args: Parameters<ChaiAssert['doesNotHaveAllKeys']>
  ): ReturnType<ChaiAssert['doesNotHaveAllKeys']> {
    return assert.doesNotHaveAllKeys(...args)
  }

  /**
   * Except the function to throw an exception. Optionally, you can assert
   * for the exception class or message.
   *
   * See @rejects for async function calls
   *
   * @example
   * function foo() { throw new Error('blow up') }
   *
   * assert.throws(foo) // passes
   * assert.throws(foo, Error) // passes
   * assert.throws(foo, 'blow up') // passes
   * assert.throws(foo, 'failed') // fails
   */
  public throws(fn: () => void, message?: string): void
  public throws(fn: () => void, errType: RegExp | ErrorConstructor, message?: string): void
  public throws(
    fn: () => void,
    constructor: ErrorConstructor,
    regExp: RegExp | string,
    message?: string
  ): void
  public throws(
    fn: () => void,
    errType?: RegExp | ErrorConstructor | string,
    regExp?: RegExp | string,
    message?: string
  ): void {
    const args: [any, any, ...any[]] = [fn, errType, regExp, message]
    return assert.throws(...args)
  }

  /**
   * Except the function to not throw an exception. Optionally, you can assert
   * the exception is not from a certain class or have a certain message
   *
   * See @rejects for async function calls
   *
   * @example
   * function foo() { throw new Error('blow up') }
   *
   * assert.doesNotThrows(foo) // fails
   * assert.doesNotThrows(foo, 'failed') // passes
   * assert.doesNotThrows(() => {}) // passes
   */
  public doesNotThrows(fn: () => void, message?: string): void
  public doesNotThrows(fn: () => void, regExp: RegExp): void
  public doesNotThrows(fn: () => void, constructor: ErrorConstructor, message?: string): void
  public doesNotThrows(
    fn: () => void,
    constructor: ErrorConstructor,
    regExp: RegExp | string,
    message?: string
  ): void
  public doesNotThrows(
    fn: () => void,
    errType?: RegExp | ErrorConstructor | string,
    regExp?: RegExp | string,
    message?: string
  ): void {
    const args: [any, any, ...any[]] = [fn, errType, regExp, message]
    return assert.doesNotThrow(...args)
  }

  /**
   * Assert the value is closer to the expected value + delta
   *
   * @example
   * assert.closeTo(10, 6, 8) // passes
   * assert.closeTo(10, 6, 4) // passes
   * assert.closeTo(10, 20, 10) // passes
   */
  public closeTo(...args: Parameters<ChaiAssert['closeTo']>): ReturnType<ChaiAssert['closeTo']> {
    return assert.closeTo(...args)
  }

  /**
   * Assert the value is equal to the expected value +/- delta range
   *
   * @example
   * assert.approximately(10, 6, 8) // passes
   * assert.approximately(10, 6, 4) // passes
   * assert.approximately(10, 20, 10) // passes
   */
  public approximately(
    ...args: Parameters<ChaiAssert['approximately']>
  ): ReturnType<ChaiAssert['approximately']> {
    return assert.approximately(...args)
  }

  /**
   * Assert two arrays to have same members. The values comparison
   * is same the `assert.equal` method.
   *
   * Use {@link sameDeepMembers} for deep comparison
   *
   * @example
   * assert.sameMembers(
   *   [1, 2, 3],
   *   [1, 2, 3]
   * ) // passes
   *
   * assert.sameMembers(
   *   [1, { id: 1 }, 3],
   *   [1, { id: 1 }, 3]
   * ) // fails
   */
  public sameMembers(
    ...args: Parameters<ChaiAssert['sameMembers']>
  ): ReturnType<ChaiAssert['sameMembers']> {
    return assert.sameMembers(...args)
  }

  /**
   * Assert two arrays to NOT have same members. The values comparison
   * is same the `assert.notEqual` method.
   *
   * Use {@link notSameDeepMembers} for deep comparison
   *
   * @example
   * assert.notSameMembers(
   *   [1, { id: 1 }, 3],
   *   [1, { id: 1 }, 3]
   * ) // passes
   *
   * assert.notSameMembers(
   *   [1, 2, 3],
   *   [1, 2, 3]
   * ) // fails
   *
   */
  public notSameMembers(
    ...args: Parameters<ChaiAssert['sameMembers']>
  ): ReturnType<ChaiAssert['sameMembers']> {
    return assert['notSameMembers'](...args)
  }

  /**
   * Assert two arrays to have same members.
   *
   * @example
   * assert.sameDeepMembers(
   *   [1, 2, 3],
   *   [1, 2, 3]
   * ) // passes
   *
   * assert.sameDeepMembers(
   *   [1, { id: 1 }, 3],
   *   [1, { id: 1 }, 3]
   * ) // passes
   */
  public sameDeepMembers(
    ...args: Parameters<ChaiAssert['sameDeepMembers']>
  ): ReturnType<ChaiAssert['sameDeepMembers']> {
    return assert.sameDeepMembers(...args)
  }

  /**
   * Assert two arrays to NOT have same members.
   *
   * @example
   * assert.notSameDeepMembers(
   *   [1, { id: 1 }, 3],
   *   [1, { id: 2 }, 3]
   * ) // passes
   *
   */
  public notSameDeepMembers(
    ...args: Parameters<ChaiAssert['sameDeepMembers']>
  ): ReturnType<ChaiAssert['sameDeepMembers']> {
    return assert['notSameDeepMembers'](...args)
  }

  /**
   * Expect two arrays to have same members and in the same order.
   *
   * The values comparison is same the `assert.equal` method.
   * Use {@link sameDeepOrderedMembers} for deep comparison
   *
   * @example
   * assert.sameOrderedMembers(
   *   [1, 2, 3],
   *   [1, 2, 3]
   * ) // passes
   *
   * assert.sameOrderedMembers(
   *   [1, 3, 2],
   *   [1, 2, 3]
   * ) // fails
   */
  public sameOrderedMembers(
    ...args: Parameters<ChaiAssert['sameOrderedMembers']>
  ): ReturnType<ChaiAssert['sameOrderedMembers']> {
    return assert.sameOrderedMembers(...args)
  }

  /**
   * Expect two arrays to either have different members or in
   * different order
   *
   * The values comparison is same the `assert.notEqual` method.
   * Use {@link notSameDeepOrderedMembers} for deep comparison
   *
   * @example
   * assert.notSameOrderedMembers(
   *   [1, 2, 3],
   *   [1, 2, 3]
   * ) // passes
   *
   * assert.notSameOrderedMembers(
   *   [1, 3, 2],
   *   [1, 2, 3]
   * ) // fails
   */
  public notSameOrderedMembers(
    ...args: Parameters<ChaiAssert['notSameOrderedMembers']>
  ): ReturnType<ChaiAssert['notSameOrderedMembers']> {
    return assert.notSameOrderedMembers(...args)
  }

  /**
   * Expect two arrays to have same members and in the same order.
   *
   * The values comparison is same the `assert.deepEqual` method.
   *
   * @example
   * assert.sameDeepOrderedMembers(
   *   [1, { id: 1 }, { name: 'virk' }],
   *   [1, { id: 1 }, { name: 'virk' }]
   * ) // passes
   *
   * assert.sameDeepOrderedMembers(
   *   [1, { id: 1 }, { name: 'virk' }],
   *   [1, { name: 'virk' }, { id: 1 }]
   * ) // fails
   */
  public sameDeepOrderedMembers(
    ...args: Parameters<ChaiAssert['sameDeepOrderedMembers']>
  ): ReturnType<ChaiAssert['sameDeepOrderedMembers']> {
    return assert.sameDeepOrderedMembers(...args)
  }

  /**
   * Expect two arrays to either have different members or in
   * different order
   *
   * The values comparison is same the `assert.notDeepEqual` method.
   * Use {@link notSameDeepOrderedMembers} for deep comparison
   *
   * @example
   * assert.notSameDeepOrderedMembers(
   *   [1, { id: 1 }, { name: 'virk' }],
   *   [1, { name: 'virk' }, { id: 1 }]
   * ) // passes
   *
   * assert.notSameDeepOrderedMembers(
   *   [1, { id: 1 }, { name: 'virk' }],
   *   [1, { id: 1 }, { name: 'virk' }]
   * ) // fails
   */
  public notSameDeepOrderedMembers(
    ...args: Parameters<ChaiAssert['notSameDeepOrderedMembers']>
  ): ReturnType<ChaiAssert['notSameDeepOrderedMembers']> {
    return assert.notSameDeepOrderedMembers(...args)
  }

  /**
   * Assert the expected array is a subset of a given array.
   *
   * The values comparison is same the `assert.equal` method.
   * Use {@link includeDeepMembers} for deep comparsion.
   *
   * @example
   * assert.includeMembers([1, 2, 4, 5], [1, 2]) // passes
   * assert.includeMembers([1, 2, 4, 5], [1, 3]) // fails
   */
  public includeMembers(
    ...args: Parameters<ChaiAssert['includeMembers']>
  ): ReturnType<ChaiAssert['includeMembers']> {
    return assert.includeMembers(...args)
  }

  /**
   * Assert the expected array is NOT a subset of a given array.
   *
   * The values comparison is same the `assert.notEqual` method.
   * Use {@link notIncludeDeepMembers} for deep comparsion.
   *
   * @example
   * assert.notIncludeMembers([1, 2, 4, 5], [1, 3]) // passes
   * assert.notIncludeMembers([1, 2, 4, 5], [1, 2]) // fails
   */
  public notIncludeMembers(
    ...args: Parameters<ChaiAssert['notIncludeMembers']>
  ): ReturnType<ChaiAssert['notIncludeMembers']> {
    return assert.notIncludeMembers(...args)
  }

  /**
   * Assert the expected array is a subset of a given array.
   *
   * The values comparison is same the `assert.deepEqual` method.
   *
   * @example
   * assert.includeDeepMembers(
   *   [{ id: 1 }, { id: 2 }],
   *   [{ id: 2 }]
   * ) // passes
   *
   * assert.includeDeepMembers(
   *   [{ id: 1 }, { id: 2 }],
   *   [{ id: 3 }]
   * ) // fails
   */
  public includeDeepMembers(
    ...args: Parameters<ChaiAssert['includeDeepMembers']>
  ): ReturnType<ChaiAssert['includeDeepMembers']> {
    return assert.includeDeepMembers(...args)
  }

  /**
   * Assert the expected array is NOT a subset of a given array.
   *
   * The values comparison is same the `assert.notDeepEqual` method.
   *
   * @example
   * assert.notIncludeDeepMembers(
   *   [{ id: 1 }, { id: 2 }],
   *   [{ id: 3 }]
   * ) // passes
   *
   * assert.notIncludeDeepMembers(
   *   [{ id: 1 }, { id: 2 }],
   *   [{ id: 2 }]
   * ) // fails
   */
  public notIncludeDeepMembers(
    ...args: Parameters<ChaiAssert['includeDeepMembers']>
  ): ReturnType<ChaiAssert['includeDeepMembers']> {
    return assert['notIncludeDeepMembers'](...args)
  }

  /**
   * Assert the expected array is a subset of a given array and
   * in the same order
   *
   * The values comparison is same the `assert.equal` method.
   * Use {@link includeDeepOrderedMembers} for deep comparsion.
   *
   * @example
   * assert.includeOrderedMembers(
   *   [1, 2, 4, 5],
   *   [1, 2, 4]
   * ) // passes
   *
   * assert.includeOrderedMembers(
   *   [1, 2, 4, 5],
   *   [1, 4, 2]
   * ) // fails
   *
   * assert.includeOrderedMembers(
   *   [1, 2, 4, 5],
   *   [1, 2, 5]
   * ) // fails
   */
  public includeOrderedMembers(
    ...args: Parameters<ChaiAssert['includeOrderedMembers']>
  ): ReturnType<ChaiAssert['includeOrderedMembers']> {
    return assert.includeOrderedMembers(...args)
  }

  /**
   * Assert the expected array is either not a subset of
   * a given array or is not in the same order.
   *
   * The values comparison is same the `assert.notEqual` method.
   * Use {@link notIncludeDeepOrderedMembers} for deep comparsion.
   *
   * @example
   *
   * assert.notIncludeOrderedMembers(
   *   [1, 2, 4, 5],
   *   [1, 4, 2]
   * ) // passes
   *
   * assert.notIncludeOrderedMembers(
   *   [1, 2, 4, 5],
   *   [1, 2, 5]
   * ) // passes
   *
   * assert.notIncludeOrderedMembers(
   *   [1, 2, 4, 5],
   *   [1, 2, 4]
   * ) // fails
   */
  public notIncludeOrderedMembers(
    ...args: Parameters<ChaiAssert['notIncludeOrderedMembers']>
  ): ReturnType<ChaiAssert['notIncludeOrderedMembers']> {
    return assert.notIncludeOrderedMembers(...args)
  }

  /**
   * Assert the expected array is a subset of a given array and
   * in the same order
   *
   * The values comparison is same the `assert.deepEqual` method.
   *
   * @example
   * assert.includeDeepOrderedMembers(
   *   [{ id: 1 }, { id: 2 }, { id: 4 }],
   *   [{ id: 1 }, { id: 2 }]
   * ) // passes
   *
   * assert.includeDeepOrderedMembers(
   *   [{ id: 1 }, { id: 2 }, { id: 4 }],
   *   [{ id: 1 }, { id: 4 }]
   * ) // fails
   *
   * assert.includeDeepOrderedMembers(
   *   [{ id: 1 }, { id: 2 }, { id: 4 }],
   *   [{ id: 1 }, { id: 4 }, { id: 2 }]
   * ) // fails
   */
  public includeDeepOrderedMembers(
    ...args: Parameters<ChaiAssert['includeDeepOrderedMembers']>
  ): ReturnType<ChaiAssert['includeDeepOrderedMembers']> {
    return assert.includeDeepOrderedMembers(...args)
  }

  /**
   * Assert the expected array is either not a subset of
   * a given array or is not in the same order.
   *
   * The values comparison is same the `assert.notDeepEqual` method.
   *
   * @example
   *
   * assert.notIncludeDeepOrderedMembers(
   *   [{ id: 1 }, { id: 2 }, { id: 4 }],
   *   [{ id: 1 }, { id: 4 }]
   * ) // passes
   *
   * assert.notIncludeDeepOrderedMembers(
   *   [{ id: 1 }, { id: 2 }, { id: 4 }],
   *   [{ id: 1 }, { id: 4 }, { id: 2 }]
   * ) // passes
   *
   * assert.notIncludeDeepOrderedMembers(
   *   [{ id: 1 }, { id: 2 }, { id: 4 }],
   *   [{ id: 1 }, { id: 2 }]
   * ) // fails
   */
  public notIncludeDeepOrderedMembers(
    ...args: Parameters<ChaiAssert['notIncludeDeepOrderedMembers']>
  ): ReturnType<ChaiAssert['notIncludeDeepOrderedMembers']> {
    return assert.notIncludeDeepOrderedMembers(...args)
  }

  /**
   * Assert the object is sealed.
   *
   * @example
   * assert.isSealed(Object.seal({})) // passes
   * assert.isSealed({}) // fails
   */
  public isSealed(...args: Parameters<ChaiAssert['isSealed']>): ReturnType<ChaiAssert['isSealed']> {
    return assert.isSealed(...args)
  }

  /**
   * Assert the object is sealed.
   *
   * @alias
   * isSealed
   *
   * @example
   * assert.sealed(Object.seal({})) // passes
   * assert.sealed({}) // fails
   */
  public sealed(...args: Parameters<ChaiAssert['isSealed']>): ReturnType<ChaiAssert['isSealed']> {
    return assert.sealed(...args)
  }

  /**
   * Assert the object is not sealed.
   *
   * @example
   * assert.isNotSealed({}) // passes
   * assert.isNotSealed(Object.seal({})) // fails
   */
  public isNotSealed(
    ...args: Parameters<ChaiAssert['isNotSealed']>
  ): ReturnType<ChaiAssert['isNotSealed']> {
    return assert.isNotSealed(...args)
  }

  /**
   * Assert the object is not sealed.
   *
   * @alias
   * isNotSealed
   *
   * @example
   * assert.notSealed({}) // passes
   * assert.notSealed(Object.seal({})) // fails
   */
  public notSealed(
    ...args: Parameters<ChaiAssert['notSealed']>
  ): ReturnType<ChaiAssert['notSealed']> {
    return assert.notSealed(...args)
  }

  /**
   * Assert the object is frozen.
   *
   * @example
   * assert.isFrozen(Object.freeze({})) // passes
   * assert.isFrozen({}) // fails
   */
  public isFrozen(...args: Parameters<ChaiAssert['isFrozen']>): ReturnType<ChaiAssert['isFrozen']> {
    return assert.isFrozen(...args)
  }

  /**
   * Assert the object is frozen.
   *
   * @alias
   * isFrozen
   *
   * @example
   * assert.frozen(Object.freeze({})) // passes
   * assert.frozen({}) // fails
   */
  public frozen(...args: Parameters<ChaiAssert['frozen']>): ReturnType<ChaiAssert['frozen']> {
    return assert.frozen(...args)
  }

  /**
   * Assert the object is not frozen.
   *
   * @example
   * assert.isNotFrozen({}) // passes
   * assert.isNotFrozen(Object.freeze({})) // fails
   */
  public isNotFrozen(
    ...args: Parameters<ChaiAssert['isNotFrozen']>
  ): ReturnType<ChaiAssert['isNotFrozen']> {
    return assert.isNotFrozen(...args)
  }

  /**
   * Assert the object is not frozen.
   *
   * @alias
   * isNotFrozen
   *
   * @example
   * assert.notFrozen({}) // passes
   * assert.notFrozen(Object.freeze({})) // fails
   */
  public notFrozen(
    ...args: Parameters<ChaiAssert['notFrozen']>
  ): ReturnType<ChaiAssert['notFrozen']> {
    return assert.notFrozen(...args)
  }

  /**
   * Assert value to be empty
   *
   * @example
   * assert.isEmpty([]) // passes
   * assert.isEmpty({}) // passes
   * assert.isEmpty('') // passes
   */
  public isEmpty(...args: Parameters<ChaiAssert['isEmpty']>): ReturnType<ChaiAssert['isEmpty']> {
    return assert.isEmpty(...args)
  }

  /**
   * Assert value to be empty
   *
   * @alias
   * isEmpty
   *
   * @example
   * assert.empty([]) // passes
   * assert.empty({}) // passes
   * assert.empty('') // passes
   */
  public empty(...args: Parameters<ChaiAssert['isEmpty']>): ReturnType<ChaiAssert['isEmpty']> {
    return assert.isEmpty(...args)
  }

  /**
   * Assert value to not be empty
   *
   * @example
   * assert.isNotEmpty([1, 2]) // passes
   * assert.isNotEmpty({ foo: 'bar' }) // passes
   * assert.isNotEmpty('hello') // passes
   */
  public isNotEmpty(
    ...args: Parameters<ChaiAssert['isNotEmpty']>
  ): ReturnType<ChaiAssert['isNotEmpty']> {
    return assert.isNotEmpty(...args)
  }

  /**
   * Assert value to not be empty
   *
   * @alias
   * isNotEmpty
   *
   * @example
   * assert.notEmpty([1, 2]) // passes
   * assert.notEmpty({ foo: 'bar' }) // passes
   * assert.notEmpty('hello') // passes
   */
  public notEmpty(
    ...args: Parameters<ChaiAssert['isNotEmpty']>
  ): ReturnType<ChaiAssert['isNotEmpty']> {
    return assert.isNotEmpty(...args)
  }

  /**
   * Assert an array or an object to contain a subset of the expected
   * value. Useful for testing API responses.
   *
   * @example
   * assert.containsSubset(
   *   { id: 1, created_at: Date },
   *   { id: 1 }
   * ) // passes
   *
   * assert.containsSubset(
   *   [
   *     { id: 1, created_at: Date },
   *     { id: 2, created_at: Date }
   *   ],
   *   [{ id: 1 }, { id: 2 }]
   * ) // passes
   */
  public containsSubset(haystack: any, needle: any, message?: string) {
    this.evaluate(subsetCompare(needle, haystack), 'expected #{act} to contain subset #{exp}', {
      expected: haystack,
      actual: needle,
      operator: 'containsSubset',
      prefix: message,
    })
  }

  /**
   * Assert an array or an object to not contain a subset of the expected
   * value.
   *
   * @example
   * assert.notContainsSubset(
   *   { id: 1, created_at: Date },
   *   { email: 'foo@bar.com' }
   * ) // passes
   */
  public notContainsSubset(haystack: any, needle: any, message?: string) {
    this.evaluate(
      !subsetCompare(needle, haystack),
      'expected #{act} to not contain subset #{exp}',
      {
        expected: haystack,
        actual: needle,
        operator: 'notContainsSubset',
        prefix: message,
      }
    )
  }

  /**
   * Assert the function to reject the promise or reject with a specific
   * error class/message
   *
   * The method returns a promise
   *
   * @example
   * await assert.reject(() => throw new Error(''))
   */
  public async rejects(fn: () => void, message?: string): Promise<void>
  public async rejects(
    fn: () => void | Promise<void>,
    errType: RegExp | ErrorConstructor,
    message?: string
  ): Promise<void>
  public async rejects(
    fn: () => void | Promise<void>,
    constructor: ErrorConstructor,
    regExp: RegExp | string,
    message?: string
  ): Promise<void>
  public async rejects(
    fn: () => void | Promise<void>,
    errType?: RegExp | ErrorConstructor | string,
    regExp?: RegExp | string,
    message?: string
  ): Promise<void> {
    let raisedException: any = null

    /**
     * Fn should be a valid function
     */
    if (typeof fn !== 'function') {
      return this.evaluate(false, 'expected #{this} to be a function', {
        thisObject: fn,
        expected: '',
        actual: '',
        prefix: message,
        operator: 'rejects',
      })
    }

    /**
     * Invoke the function
     */
    try {
      await fn()
    } catch (error) {
      raisedException = error
    }

    /**
     * Normalizing values
     */
    const expectedExceptionClass = errType && typeof errType === 'function' ? errType : null
    let expectedErrorMessageRegex = regExp && regExp instanceof RegExp ? regExp : null
    let expectedErrorMessage = regExp && typeof regExp === 'string' ? regExp : null
    if (!expectedErrorMessageRegex && !expectedErrorMessage && errType) {
      if (errType instanceof RegExp) {
        expectedErrorMessageRegex = errType
      } else if (typeof errType === 'string') {
        expectedErrorMessage = errType
      }
    }

    /**
     * No exception was raised
     */
    if (!raisedException) {
      return this.evaluate(false, 'expected #{this} to throw an error', {
        thisObject: fn,
        expected: '',
        actual: '',
        prefix: message,
        operator: 'rejects',
      })
    }

    /**
     * Expected constructors are different
     */
    if (expectedExceptionClass && raisedException instanceof expectedExceptionClass === false) {
      return this.evaluate(false, 'expected #{this} to throw #{exp} but #{act} was thrown', {
        thisObject: fn,
        expected: expectedExceptionClass,
        actual: raisedException,
        prefix: message,
        operator: 'rejects',
      })
    }

    /**
     * Message doesn't match the expected regex
     */
    if (expectedErrorMessageRegex && !expectedErrorMessageRegex.test(raisedException.message)) {
      return this.evaluate(
        false,
        'expected #{this} to throw error matching #{exp} but got #{act}',
        {
          thisObject: fn,
          expected: expectedErrorMessageRegex,
          actual: raisedException.message,
          prefix: message,
          operator: 'rejects',
        }
      )
    }

    /**
     * Message doesn't match the expected message
     */
    if (expectedErrorMessage && raisedException.message !== expectedErrorMessage) {
      return this.evaluate(
        false,
        'expected #{this} to throw error including #{exp} but got #{act}',
        {
          thisObject: fn,
          expected: expectedErrorMessage,
          actual: raisedException.message,
          prefix: message,
          operator: 'rejects',
        }
      )
    }
  }

  /**
   * Assert the function does not rejects the promise or the rejection
   * does not match the expectations.
   *
   * The method returns a promise
   *
   * @example
   * await assert.doesNotRejects(
   *   async () => throw new Error('foo'),
   *   HttpError
   * ) // passes: Error !== HttpError
   *
   * await assert.doesNotRejects(
   *   async () => throw new HttpError('Resource not found'),
   *   HttpError,
   *   'Server not available'
   * ) // passes: Resource not found !== Server not available
   *
   * await assert.doesNotRejects(
   *   async () => return 'foo',
   * ) // passes
   */
  public async doesNotRejects(fn: () => void, message?: string): Promise<void>
  public async doesNotRejects(
    fn: () => void | Promise<void>,
    errType: RegExp | ErrorConstructor,
    message?: string
  ): Promise<void>
  public async doesNotRejects(
    fn: () => void | Promise<void>,
    constructor: ErrorConstructor,
    regExp: RegExp | string,
    message?: string
  ): Promise<void>
  public async doesNotRejects(
    fn: () => void | Promise<void>,
    errType?: RegExp | ErrorConstructor | string,
    regExp?: RegExp | string,
    message?: string
  ): Promise<void> {
    let raisedException: any = null

    /**
     * Fn should be a valid function
     */
    if (typeof fn !== 'function') {
      return this.evaluate(false, 'expected #{this} to be a function', {
        thisObject: fn,
        expected: '',
        actual: '',
        prefix: message,
        operator: 'doesNotRejects',
      })
    }

    /**
     * Invoke the function
     */
    try {
      await fn()
    } catch (error) {
      raisedException = error
    }

    /**
     * No exception was raised (as expected)
     */
    if (!raisedException) {
      return
    }

    /**
     * Normalizing values
     */
    const expectedExceptionClass = errType && typeof errType === 'function' ? errType : undefined
    let expectedErrorMessageRegex = regExp && regExp instanceof RegExp ? regExp : undefined
    let expectedErrorMessage = regExp && typeof regExp === 'string' ? regExp : undefined
    const hasMatchingErrorClass =
      expectedExceptionClass && raisedException instanceof expectedExceptionClass

    if (!expectedErrorMessageRegex && expectedErrorMessage === undefined && errType) {
      if (errType instanceof RegExp) {
        expectedErrorMessageRegex = errType
      } else if (typeof errType === 'string') {
        expectedErrorMessage = errType
      }
    }

    /**
     * Exception was raised and caller is not trying to narrow down the exception
     */
    if (!expectedErrorMessage && !expectedErrorMessageRegex && !expectedExceptionClass) {
      return this.evaluate(false, 'expected #{this} to not throw an error but #{act} was thrown', {
        thisObject: fn,
        expected: expectedExceptionClass,
        actual: raisedException,
        prefix: message,
        operator: 'doesNotRejects',
      })
    }

    /**
     * An exception was raised for not the expected error constructor
     */
    if (hasMatchingErrorClass && !expectedErrorMessage && !expectedErrorMessageRegex) {
      return this.evaluate(false, 'expected #{this} to not throw #{exp} but #{act} was thrown', {
        thisObject: fn,
        expected: expectedExceptionClass,
        actual: raisedException,
        prefix: message,
        operator: 'doesNotRejects',
      })
    }

    if (expectedErrorMessageRegex && expectedErrorMessageRegex.test(raisedException.message)) {
      return this.evaluate(false, 'expected #{this} to throw error not matching #{exp}', {
        thisObject: fn,
        expected: expectedErrorMessageRegex,
        actual: raisedException.message,
        prefix: message,
        operator: 'doesNotRejects',
      })
    }

    /**
     * Message doesn't match the expected message
     */
    if (expectedErrorMessage && raisedException.message === expectedErrorMessage) {
      return this.evaluate(
        false,
        hasMatchingErrorClass
          ? 'expected #{this} to not throw #{exp} but #{act} was thrown'
          : 'expected #{this} to throw error not including #{act}',
        {
          thisObject: fn,
          expected: hasMatchingErrorClass ? expectedExceptionClass : expectedErrorMessage,
          actual: hasMatchingErrorClass ? raisedException : raisedException.message,
          prefix: message,
          operator: 'doesNotRejects',
        }
      )
    }
  }
}
