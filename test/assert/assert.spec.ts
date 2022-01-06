/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { DateTime } from 'luxon'
import { Assert } from '../../src/Assert'
import { expectError, expectAsyncError } from '../../test-helpers'

/**
 * Tests in this file is a copy of
 * https://github.com/chaijs/chai/blob/a8359d3d15779a23a7957a4c52539d48de2763e0/test/assert.js
 * to ensure our assert implementation matches the chai.assert.
 *
 * Therefore the tests structure + naming is not same as I generally
 * do.
 */
test.group('assert', function () {
  test('assert', function () {
    let foo = 'bar'

    const assert = new Assert()
    assert.assert(foo === 'bar', 'expected foo to equal `bar`')

    expectError(function () {
      assert.assert(foo === 'baz', 'expected foo to equal `bar`')
    }, 'expected foo to equal `bar`')

    expectError(function () {
      assert.assert(foo === 'baz', 'expected foo to equal `bar`')
    }, 'expected foo to equal `bar`')
  })

  test('isTrue', function () {
    const assert = new Assert()
    assert.isTrue(true)

    expectError(function () {
      assert.isTrue(false, 'blah')
    }, 'blah: expected false to be true')

    expectError(function () {
      assert.isTrue(1)
    }, 'expected 1 to be true')

    expectError(function () {
      assert.isTrue('test')
    }, "expected 'test' to be true")
  })

  test('isNotTrue', function () {
    const assert = new Assert()
    assert.isNotTrue(false)
    assert.isNotTrue(1)
    assert.isNotTrue('foo')

    expectError(function () {
      assert.isNotTrue(true, 'blah')
    }, 'blah: expected true to not equal true')
  })

  test('isOk / ok', function () {
    const assert = new Assert()

    ;['isOk', 'ok'].forEach(function (isOk) {
      assert[isOk](true)
      assert[isOk](1)
      assert[isOk]('test')

      expectError(function () {
        assert[isOk](false, 'blah')
      }, 'blah: expected false to be truthy')

      expectError(function () {
        assert[isOk](0)
      }, 'expected 0 to be truthy')

      expectError(function () {
        assert[isOk]('')
      }, "expected '' to be truthy")
    })
  })

  test('isNotOk, notOk', function () {
    const assert = new Assert()

    ;['isNotOk', 'notOk'].forEach(function (isNotOk) {
      assert[isNotOk](false)
      assert[isNotOk](0)
      assert[isNotOk]('')

      expectError(function () {
        assert[isNotOk](true, 'blah')
      }, 'blah: expected true to be falsy')

      expectError(function () {
        assert[isNotOk](1)
      }, 'expected 1 to be falsy')

      expectError(function () {
        assert[isNotOk]('test')
      }, "expected 'test' to be falsy")
    })
  })

  test('isFalse', function () {
    const assert = new Assert()

    assert.isFalse(false)

    expectError(function () {
      assert.isFalse(true, 'blah')
    }, 'blah: expected true to be false')

    expectError(function () {
      assert.isFalse(0)
    }, 'expected 0 to be false')
  })

  test('isNotFalse', function () {
    const assert = new Assert()

    assert.isNotFalse(true)

    expectError(function () {
      assert.isNotFalse(false, 'blah')
    }, 'blah: expected false to not equal false')
  })

  test('equal', function () {
    const assert = new Assert()

    let foo: undefined
    assert.equal(foo, undefined)

    if (typeof Symbol === 'function') {
      var sym = Symbol()
      assert.equal(sym, sym)
    }

    expectError(function () {
      assert.equal(1, 2, 'blah')
    }, 'blah: expected 1 to equal 2')
  })

  test('typeof', function () {
    const assert = new Assert()

    assert.typeOf('test', 'string')
    assert.typeOf(true, 'boolean')
    assert.typeOf(5, 'number')
    assert.typeOf(new Date(), 'date')

    if (typeof Symbol === 'function') {
      assert.typeOf(Symbol(), 'symbol')
    }

    expectError(function () {
      assert.typeOf(5, 'string', 'blah')
    }, 'blah: expected 5 to be a string')
  })

  test('notTypeOf', function () {
    const assert = new Assert()

    assert.notTypeOf('test', 'number')

    expectError(function () {
      assert.notTypeOf(5, 'number', 'blah')
    }, 'blah: expected 5 not to be a number')
  })

  test('instanceOf', function () {
    const assert = new Assert()

    class Foo {}
    class Bar extends Foo {}
    assert.instanceOf(new Foo(), Foo)
    assert.instanceOf(new Bar(), Foo)

    expectError(function () {
      assert.instanceOf(new Foo(), 1 as any, 'blah')
    }, 'blah: The instanceof assertion needs a constructor but number was given.')

    expectError(function () {
      assert.instanceOf(new Foo(), 'batman' as any)
    }, 'The instanceof assertion needs a constructor but string was given.')

    expectError(function () {
      assert.instanceOf(new Foo(), {} as any)
    }, 'The instanceof assertion needs a constructor but Object was given.')

    expectError(function () {
      assert.instanceOf(new Foo(), true as any)
    }, 'The instanceof assertion needs a constructor but boolean was given.')

    expectError(function () {
      assert.instanceOf(new Foo(), null as any)
    }, 'The instanceof assertion needs a constructor but null was given.')

    expectError(function () {
      assert.instanceOf(new Foo(), undefined as any)
    }, 'The instanceof assertion needs a constructor but undefined was given.')

    expectError(function () {
      function Thing() {}
      var t = new Thing()
      Thing.prototype = 1337
      assert.instanceOf(t, Thing)
    }, 'The instanceof assertion needs a constructor but function was given.')

    if (typeof Symbol !== 'undefined' && typeof Symbol.hasInstance !== 'undefined') {
      expectError(function () {
        assert.instanceOf(new Foo(), Symbol() as any)
      }, 'The instanceof assertion needs a constructor but symbol was given.')

      expectError(function () {
        var FakeConstructor = {}
        var fakeInstanceB = 4
        FakeConstructor[Symbol.hasInstance] = function (val: any) {
          return val === 3
        }

        assert.instanceOf(fakeInstanceB, FakeConstructor as any)
      }, 'expected 4 to be an instance of an unnamed constructor')
    }

    expectError(function () {
      assert.instanceOf(5, Foo, 'blah')
    }, 'blah: expected 5 to be an instance of Foo')

    function CrashyObject() {}
    CrashyObject.prototype.inspect = function () {
      throw new Error("Arg's inspect() called even though the test passed")
    }
    assert.instanceOf(new CrashyObject(), CrashyObject)
  })

  test('notInstanceOf', function () {
    const assert = new Assert()

    class Foo {}
    assert.notInstanceOf(new Foo(), String)

    expectError(function () {
      assert.notInstanceOf(new Foo(), 1 as any, 'blah')
    }, 'blah: The instanceof assertion needs a constructor but number was given.')

    expectError(function () {
      assert.notInstanceOf(new Foo(), 'batman' as any)
    }, 'The instanceof assertion needs a constructor but string was given.')

    expectError(function () {
      assert.notInstanceOf(new Foo(), {} as any)
    }, 'The instanceof assertion needs a constructor but Object was given.')

    expectError(function () {
      assert.notInstanceOf(new Foo(), true as any)
    }, 'The instanceof assertion needs a constructor but boolean was given.')

    expectError(function () {
      assert.notInstanceOf(new Foo(), null as any)
    }, 'The instanceof assertion needs a constructor but null was given.')

    expectError(function () {
      assert.notInstanceOf(new Foo(), undefined as any)
    }, 'The instanceof assertion needs a constructor but undefined was given.')

    if (typeof Symbol !== 'undefined' && typeof Symbol.hasInstance !== 'undefined') {
      expectError(function () {
        assert.notInstanceOf(new Foo(), Symbol() as any)
      }, 'The instanceof assertion needs a constructor but symbol was given.')

      expectError(function () {
        var FakeConstructor = {}
        var fakeInstanceB = 4
        FakeConstructor[Symbol.hasInstance] = function (val: any) {
          return val === 4
        }

        assert.notInstanceOf(fakeInstanceB, FakeConstructor as any)
      }, 'expected 4 to not be an instance of an unnamed constructor')
    }

    expectError(function () {
      assert.notInstanceOf(new Foo(), Foo, 'blah')
    }, 'blah: expected {} to not be an instance of Foo')
  })

  test('isObject', function () {
    const assert = new Assert()

    function Foo() {}
    assert.isObject({})
    assert.isObject(new Foo())

    expectError(function () {
      assert.isObject(true, 'blah')
    }, 'blah: expected true to be an object')

    expectError(function () {
      assert.isObject([], 'blah')
    }, 'blah: expected [] to be an object')

    expectError(function () {
      assert.isObject(null, 'blah')
    }, 'blah: expected null to be an object')

    expectError(function () {
      assert.isObject(Foo)
    }, 'expected [Function: Foo] to be an object')

    expectError(function () {
      assert.isObject('foo')
    }, "expected 'foo' to be an object")
  })

  test('isNotObject', function () {
    const assert = new Assert()

    assert.isNotObject(5)

    expectError(function () {
      assert.isNotObject({}, 'blah')
    }, 'blah: expected {} not to be an object')
  })

  test('notEqual', function () {
    const assert = new Assert()

    assert.notEqual(3, 4)

    if (typeof Symbol === 'function') {
      const sym1 = Symbol()
      const sym2 = Symbol()
      assert.notEqual(sym1, sym2)
    }

    expectError(function () {
      assert.notEqual(5, 5, 'blah')
    }, 'blah: expected 5 to not equal 5')
  })

  test('strictEqual', function () {
    const assert = new Assert()
    assert.strictEqual('foo', 'foo')

    if (typeof Symbol === 'function') {
      var sym = Symbol()
      assert.strictEqual(sym, sym)
    }

    expectError(function () {
      assert.strictEqual('5', 5, 'blah')
    }, "blah: expected '5' to equal 5")
  })

  test('notStrictEqual', function () {
    const assert = new Assert()
    assert.notStrictEqual(5, '5')

    if (typeof Symbol === 'function') {
      const sym1 = Symbol()
      const sym2 = Symbol()
      assert.notStrictEqual(sym1, sym2)
    }

    expectError(function () {
      assert.notStrictEqual(5, 5, 'blah')
    }, 'blah: expected 5 to not equal 5')
  })

  test('deepEqual', function () {
    const assert = new Assert()

    assert.deepEqual({ tea: 'chai' }, { tea: 'chai' })

    assert.deepEqual([NaN], [NaN])
    assert.deepEqual({ tea: NaN }, { tea: NaN })

    expectError(function () {
      assert.deepEqual({ tea: 'chai' }, { tea: 'black' }, 'blah')
    }, "blah: expected { tea: 'chai' } to deeply equal { tea: 'black' }")

    const obja = Object.create({ tea: 'chai' })
    const objb = Object.create({ tea: 'chai' })

    assert.deepEqual(obja, objb)

    const obj1 = Object.create({ tea: 'chai' })
    const obj2 = Object.create({ tea: 'black' })

    expectError(function () {
      assert.deepEqual(obj1, obj2)
    }, `expected { tea: 'chai' } to deeply equal { tea: 'black' }`)
  })

  test('deepEqual (ordering)', function () {
    const assert = new Assert()

    const a = { a: 'b', c: 'd' }
    const b = { c: 'd', a: 'b' }
    assert.deepEqual(a, b)

    /**
     * Arrays should be in same order
     */
    expectError(function () {
      assert.deepEqual([1, 2, 3, 4], [4, 2, 1, 3])
    }, `expected [ 1, 2, 3, 4 ] to deeply equal [ 4, 2, 1, 3 ]`)
  })

  test('deepEqual /regexp/', function () {
    const assert = new Assert()

    assert.deepEqual(/a/, /a/)
    assert.notDeepEqual(/a/, /b/)
    assert.notDeepEqual(/a/, {})
    assert.deepEqual(/a/g, /a/g)
    assert.notDeepEqual(/a/g, /b/g)
    assert.deepEqual(/a/i, /a/i)
    assert.notDeepEqual(/a/i, /b/i)
    assert.deepEqual(/a/m, /a/m)
    assert.notDeepEqual(/a/m, /b/m)
  })

  test('deepEqual (Date)', function () {
    const assert = new Assert()

    const a = new Date(1, 2, 3)
    const b = new Date(4, 5, 6)
    assert.deepEqual(a, a)
    assert.deepEqual(new Date('2020 01 22'), new Date('2020 01 22'))
    assert.notDeepEqual(a, b)
    assert.notDeepEqual(a, {})
  })

  test('deepEqual (circular)', function () {
    const assert = new Assert()

    const circularObject: any = {}
    const secondCircularObject: any = {}

    circularObject.field = circularObject
    secondCircularObject.field = secondCircularObject

    assert.deepEqual(circularObject, secondCircularObject)

    expectError(function () {
      secondCircularObject.field2 = secondCircularObject
      assert.deepEqual(circularObject, secondCircularObject)
    }, 'expected { field: [Circular] } to deeply equal { Object (field, field2) }')
  })

  test('notDeepEqual', function () {
    const assert = new Assert()
    assert.notDeepEqual({ tea: 'jasmine' }, { tea: 'chai' })

    expectError(function () {
      assert.notDeepEqual({ tea: 'chai' }, { tea: 'chai' }, 'blah')
    }, "blah: expected { tea: 'chai' } to not deeply equal { tea: 'chai' }")
  })

  test('notDeepEqual (circular)', function () {
    const assert = new Assert()

    const circularObject: any = {}
    const secondCircularObject: any = { tea: 'jasmine' }
    circularObject.field = circularObject
    secondCircularObject.field = secondCircularObject

    assert.notDeepEqual(circularObject, secondCircularObject)

    expectError(function () {
      delete secondCircularObject.tea
      assert.notDeepEqual(circularObject, secondCircularObject)
    }, 'expected { field: [Circular] } to not deeply equal { field: [Circular] }')
  })

  test('isNull', function () {
    const assert = new Assert()
    assert.isNull(null)

    expectError(function () {
      assert.isNull(undefined, 'blah')
    }, 'blah: expected undefined to equal null')
  })

  test('isNotNull', function () {
    const assert = new Assert()
    assert.isNotNull(undefined)

    expectError(function () {
      assert.isNotNull(null, 'blah')
    }, 'blah: expected null to not equal null')
  })

  test('isNaN', function () {
    const assert = new Assert()
    assert.isNaN(NaN)

    expectError(function () {
      assert.isNaN(Infinity, 'blah')
    }, 'blah: expected Infinity to be NaN')

    expectError(function () {
      assert.isNaN(undefined)
    }, 'expected undefined to be NaN')

    expectError(function () {
      assert.isNaN({})
    }, 'expected {} to be NaN')

    expectError(function () {
      assert.isNaN(4)
    }, 'expected 4 to be NaN')
  })

  test('isNotNaN', function () {
    const assert = new Assert()

    assert.isNotNaN(4)
    assert.isNotNaN(Infinity)
    assert.isNotNaN(undefined)
    assert.isNotNaN({})

    expectError(function () {
      assert.isNotNaN(NaN, 'blah')
    }, 'blah: expected NaN not to be NaN')
  })

  test('exists', function () {
    const assert = new Assert()

    const meeber = 'awesome'
    let iDoNotExist: undefined

    assert.exists(meeber)
    assert.exists(0)
    assert.exists(false)
    assert.exists('')

    expectError(function () {
      assert.exists(iDoNotExist, 'blah')
    }, 'blah: expected undefined to exist')
  })

  test('notExists', function () {
    const assert = new Assert()

    const meeber = 'awesome'
    let iDoNotExist: undefined

    assert.notExists(iDoNotExist)

    expectError(function () {
      assert.notExists(meeber, 'blah')
    }, "blah: expected 'awesome' to not exist")
  })

  test('isUndefined', function () {
    const assert = new Assert()
    assert.isUndefined(undefined)

    expectError(function () {
      assert.isUndefined(null, 'blah')
    }, 'blah: expected null to equal undefined')
  })

  test('isDefined', function () {
    const assert = new Assert()
    assert.isDefined(null)

    expectError(function () {
      assert.isDefined(undefined, 'blah')
    }, 'blah: expected undefined to not equal undefined')
  })

  test('isFunction', function () {
    const assert = new Assert()

    const func = function () {}
    assert.isFunction(func)
    assert.isFunction(() => {})
    assert.isFunction(class Foo {})

    expectError(function () {
      assert.isFunction({}, 'blah')
    }, 'blah: expected {} to be a function')
  })

  test('isNotFunction', function () {
    const assert = new Assert()
    assert.isNotFunction(5)

    expectError(function () {
      assert.isNotFunction(function () {}, 'blah')
    }, 'blah: expected [Function] not to be a function')
  })

  test('isArray', function () {
    const assert = new Assert()

    assert.isArray([])
    assert.isArray(new Array([]))

    expectError(function () {
      assert.isArray({}, 'blah')
    }, 'blah: expected {} to be an array')
  })

  test('isNotArray', function () {
    const assert = new Assert()
    assert.isNotArray(3)

    expectError(function () {
      assert.isNotArray([], 'blah')
    }, 'blah: expected [] not to be an array')

    expectError(function () {
      // eslint-disable-next-line no-array-constructor
      assert.isNotArray(new Array())
    }, 'expected [] not to be an array')
  })

  test('isString', function () {
    const assert = new Assert()

    assert.isString('Foo')
    // eslint-disable-next-line no-new-wrappers
    assert.isString(new String('foo'))
    // eslint-disable-next-line no-new-wrappers
    assert.isString(new String(true))

    expectError(function () {
      assert.isString(1, 'blah')
    }, 'blah: expected 1 to be a string')
  })

  test('isNotString', function () {
    const assert = new Assert()
    assert.isNotString(3)
    assert.isNotString(['hello'])

    expectError(function () {
      assert.isNotString('hello', 'blah')
    }, "blah: expected 'hello' not to be a string")
  })

  test('isNumber', function () {
    const assert = new Assert()
    assert.isNumber(1)
    assert.isNumber(Number('3'))

    expectError(function () {
      assert.isNumber('1', 'blah')
    }, "blah: expected '1' to be a number")
  })

  test('isNotNumber', function () {
    const assert = new Assert()
    assert.isNotNumber('hello')
    assert.isNotNumber([5])

    expectError(function () {
      assert.isNotNumber(4, 'blah')
    }, 'blah: expected 4 not to be a number')
  })

  test('isFinite', function () {
    const assert = new Assert()
    assert.isFinite(4)
    assert.isFinite(-10)

    expectError(function () {
      assert.isFinite(NaN, 'blah')
    }, 'blah: expected NaN to be a finite number')

    expectError(function () {
      assert.isFinite(Infinity)
    }, 'expected Infinity to be a finite number')

    expectError(function () {
      assert.isFinite('foo')
    }, "expected 'foo' to be a finite number")

    expectError(function () {
      assert.isFinite([])
    }, 'expected [] to be a finite number')

    expectError(function () {
      assert.isFinite({})
    }, 'expected {} to be a finite number')
  })

  test('isBoolean', function () {
    const assert = new Assert()
    assert.isBoolean(true)
    assert.isBoolean(false)

    expectError(function () {
      assert.isBoolean('1', 'blah')
    }, "blah: expected '1' to be a boolean")
  })

  test('isNotBoolean', function () {
    const assert = new Assert()
    assert.isNotBoolean('true')

    expectError(function () {
      assert.isNotBoolean(true, 'blah')
    }, 'blah: expected true not to be a boolean')

    expectError(function () {
      assert.isNotBoolean(false)
    }, 'expected false not to be a boolean')
  })

  test('include', function () {
    const assert = new Assert()
    assert.include('foobar', 'bar')
    assert.include('', '')
    assert.include([1, 2, 3], 3)

    assert.include(new Error('foo'), { message: 'foo' })

    /**
     * Does not work with nested properties
     */
    expectError(function () {
      assert.include(
        {
          id: 1,
          name: 'virk',
          posts: [
            {
              id: 1,
              title: 'Hello world',
            },
          ],
        },
        {
          name: 'virk',
          posts: [
            {
              title: 'Hello world',
            },
          ],
        }
      )
    }, "expected { Object (id, name, ...) } to have property 'posts' of [ { title: 'Hello world' } ], but got [ { id: 1, title: 'Hello world' } ]")

    if (typeof Symbol !== 'undefined' && typeof Symbol.toStringTag !== 'undefined') {
      var customObj = { a: 1 }
      customObj[Symbol.toStringTag] = 'foo'
      assert.include(customObj, { a: 1 })
    }

    const obj1 = { a: 1 }
    const obj2 = { b: 2 }
    assert.include([obj1, obj2], obj1)
    assert.include({ foo: obj1, bar: obj2 }, { foo: obj1 })
    assert.include({ foo: obj1, bar: obj2 }, { foo: obj1, bar: obj2 })

    if (typeof Map === 'function') {
      var map = new Map()
      var val = [{ a: 1 }]
      map.set('a', val)
      map.set('b', 2)
      map.set('c', -0)
      map.set('d', NaN)

      assert.include(map, val)
      assert.include(map, 2)
      assert.include(map, 0)
      assert.include(map, NaN)
    }

    if (typeof Set === 'function') {
      var set = new Set()
      const value = [{ a: 1 }]
      set.add(value)
      set.add(2)
      set.add(-0)
      set.add(NaN)

      assert.include(set, value)
      assert.include(set, 2)
      if (set.has(0)) {
        // This test is skipped in IE11 because (contrary to spec) IE11 uses
        // SameValue instead of SameValueZero equality for sets.
        assert.include(set, 0)
      }
      assert.include(set, NaN)
    }

    if (typeof WeakSet === 'function') {
      const ws = new WeakSet()
      const value = [{ a: 1 }]
      ws.add(value)

      assert.include(ws, value)
    }

    if (typeof Symbol === 'function') {
      const sym1 = Symbol()
      const sym2 = Symbol()
      assert.include([sym1, sym2], sym1)
    }

    expectError(function () {
      assert.include('foobar', 'baz', 'blah')
    }, "blah: expected 'foobar' to include 'baz'")

    expectError(function () {
      assert.include([{ a: 1 }, { b: 2 }], { a: 1 })
    }, 'expected [ { a: 1 }, { b: 2 } ] to include { a: 1 }')

    expectError(function () {
      assert.include({ foo: { a: 1 }, bar: { b: 2 } }, { foo: { a: 1 } }, 'blah')
    }, "blah: expected { foo: { a: 1 }, bar: { b: 2 } } to have property 'foo' of { a: 1 }, but got { a: 1 }")

    expectError(function () {
      assert.include(true, true, 'blah')
    }, 'blah: the given combination of arguments (boolean and boolean) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a boolean')

    expectError(function () {
      assert.include(42, 'bar')
    }, 'the given combination of arguments (number and string) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a string')

    expectError(function () {
      assert.include(null, 42)
    }, 'the given combination of arguments (null and number) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a number')

    expectError(function () {
      assert.include(undefined, 'bar')
    }, 'the given combination of arguments (undefined and string) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a string')
  })

  test('notInclude', function () {
    const assert = new Assert()

    assert.notInclude('foobar', 'baz')
    assert.notInclude([1, 2, 3], 4)

    const obj1 = { a: 1 }
    const obj2 = { b: 2 }

    assert.notInclude([obj1, obj2], { a: 1 })
    assert.notInclude({ foo: obj1, bar: obj2 }, { foo: { a: 1 } })
    assert.notInclude({ foo: obj1, bar: obj2 }, { foo: obj1, bar: { b: 2 } })

    if (typeof Map === 'function') {
      var map = new Map()
      var val = [{ a: 1 }]
      map.set('a', val)
      map.set('b', 2)

      assert.notInclude(map, [{ a: 1 }])
      assert.notInclude(map, 3)
    }

    if (typeof Set === 'function') {
      const set = new Set()
      const value = [{ a: 1 }]
      set.add(value)
      set.add(2)

      assert.include(set, value)
      assert.include(set, 2)

      assert.notInclude(set, [{ a: 1 }])
      assert.notInclude(set, 3)
    }

    if (typeof WeakSet === 'function') {
      const ws = new WeakSet()
      const value = [{ a: 1 }]
      ws.add(value)

      assert.notInclude(ws, [{ a: 1 }])
      assert.notInclude(ws, {})
    }

    if (typeof Symbol === 'function') {
      const sym1 = Symbol()
      const sym2 = Symbol()
      const sym3 = Symbol()
      assert.notInclude([sym1, sym2], sym3)
    }

    expectError(function () {
      const obja = { a: 1 }
      const objb = { b: 2 }
      assert.notInclude([obja, objb], obja, 'blah')
    }, 'blah: expected [ { a: 1 }, { b: 2 } ] to not include { a: 1 }')

    expectError(function () {
      const obja = { a: 1 }
      const objb = { b: 2 }
      assert.notInclude({ foo: obja, bar: objb }, { foo: obja, bar: objb }, 'blah')
    }, "blah: expected { foo: { a: 1 }, bar: { b: 2 } } to not have property 'foo' of { a: 1 }")

    expectError(function () {
      assert.notInclude(true, true, 'blah')
    }, 'blah: the given combination of arguments (boolean and boolean) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a boolean')

    expectError(function () {
      assert.notInclude(42, 'bar')
    }, 'the given combination of arguments (number and string) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a string')

    expectError(function () {
      assert.notInclude(null, 42)
    }, 'the given combination of arguments (null and number) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a number')

    expectError(function () {
      assert.notInclude(undefined, 'bar')
    }, 'the given combination of arguments (undefined and string) is invalid for this assertion. ' +
      'You can use an array, a map, an object, a set, a string, or a weakset instead of a string')

    expectError(function () {
      assert.notInclude('foobar', 'bar')
    }, "expected 'foobar' to not include 'bar'")
  })

  test('deepInclude and notDeepInclude', function () {
    const assert = new Assert()

    const obj1 = { a: 1 }
    const obj2 = { b: 2 }

    assert.deepInclude([obj1, obj2], { a: 1 })
    assert.notDeepInclude([obj1, obj2], { a: 9 })
    assert.notDeepInclude([obj1, obj2], { z: 1 })
    assert.deepInclude([1, [2], 3], [2])
    assert.deepInclude({ foo: obj1, bar: obj2 }, { foo: { a: 1 } })
    assert.deepInclude({ foo: obj1, bar: obj2 }, { foo: { a: 1 }, bar: { b: 2 } })
    assert.notDeepInclude({ foo: obj1, bar: obj2 }, { foo: { a: 9 } })
    assert.notDeepInclude({ foo: obj1, bar: obj2 }, { foo: { z: 1 } })
    assert.notDeepInclude({ foo: obj1, bar: obj2 }, { baz: { a: 1 } })
    assert.notDeepInclude({ foo: obj1, bar: obj2 }, { foo: { a: 1 }, bar: { b: 9 } })

    if (typeof Map === 'function') {
      var map = new Map()
      map.set(1, [{ a: 1 }])

      assert.deepInclude(map, [{ a: 1 }])
    }

    if (typeof Set === 'function') {
      var set = new Set()
      set.add([{ a: 1 }])

      assert.deepInclude(set, [{ a: 1 }])
    }

    if (typeof WeakSet === 'function') {
      expectError(function () {
        assert.deepInclude(new WeakSet(), {}, 'foo')
      }, 'foo: unable to use .deep.include with WeakSet')
    }

    expectError(function () {
      assert.deepInclude([obj1, obj2], { a: 9 }, 'blah')
    }, 'blah: expected [ { a: 1 }, { b: 2 } ] to deep include { a: 9 }')

    expectError(function () {
      assert.notDeepInclude([obj1, obj2], { a: 1 })
    }, 'expected [ { a: 1 }, { b: 2 } ] to not deep include { a: 1 }')

    expectError(function () {
      assert.deepInclude({ foo: obj1, bar: obj2 }, { foo: { a: 1 }, bar: { b: 9 } }, 'blah')
    }, "blah: expected { foo: { a: 1 }, bar: { b: 2 } } to have deep property 'bar' of { b: 9 }, but got { b: 2 }")

    expectError(function () {
      assert.notDeepInclude({ foo: obj1, bar: obj2 }, { foo: { a: 1 }, bar: { b: 2 } }, 'blah')
    }, "blah: expected { foo: { a: 1 }, bar: { b: 2 } } to not have deep property 'foo' of { a: 1 }")
  })

  test('ownInclude and notOwnInclude', function () {
    const assert = new Assert()

    assert.ownInclude({ a: 1 }, { a: 1 })
    assert.notOwnInclude({ a: 1 }, { a: 3 })
    assert.notOwnInclude({ a: 1 }, { toString: Object.prototype.toString })

    assert.notOwnInclude({ a: { b: 2 } }, { a: { b: 2 } })

    expectError(function () {
      assert.ownInclude({ a: 1 }, { a: 3 }, 'blah')
    }, "blah: expected { a: 1 } to have own property 'a' of 3, but got 1")

    expectError(function () {
      assert.ownInclude({ a: 1 }, { a: 3 }, 'blah')
    }, "blah: expected { a: 1 } to have own property 'a' of 3, but got 1")

    expectError(function () {
      assert.ownInclude({ a: 1 }, { toString: Object.prototype.toString })
    }, "expected { a: 1 } to have own property 'toString'")

    expectError(function () {
      assert.notOwnInclude({ a: 1 }, { a: 1 }, 'blah')
    }, "blah: expected { a: 1 } to not have own property 'a' of 1")
  })

  test('deepOwnInclude and notDeepOwnInclude', function () {
    const assert = new Assert()

    assert.deepOwnInclude({ a: { b: 2 } }, { a: { b: 2 } })
    assert.notDeepOwnInclude({ a: { b: 2 } }, { a: { c: 3 } })
    assert.notDeepOwnInclude({ a: { b: 2 } }, { toString: Object.prototype.toString })

    expectError(function () {
      assert.deepOwnInclude({ a: { b: 2 } }, { a: { c: 3 } }, 'blah')
    }, "blah: expected { a: { b: 2 } } to have deep own property 'a' of { c: 3 }, but got { b: 2 }")

    expectError(function () {
      assert.deepOwnInclude({ a: { b: 2 } }, { a: { c: 3 } }, 'blah')
    }, "blah: expected { a: { b: 2 } } to have deep own property 'a' of { c: 3 }, but got { b: 2 }")

    expectError(function () {
      assert.deepOwnInclude({ a: { b: 2 } }, { toString: Object.prototype.toString })
    }, "expected { a: { b: 2 } } to have deep own property 'toString'")

    expectError(function () {
      assert.notDeepOwnInclude({ a: { b: 2 } }, { a: { b: 2 } }, 'blah')
    }, "blah: expected { a: { b: 2 } } to not have deep own property 'a' of { b: 2 }")
  })

  test('keys(array|Object|arguments)', function () {
    const assert = new Assert()

    assert.onlyProperties({ foo: 1 }, ['foo'])
    assert.onlyProperties({ foo: 1, bar: 2 }, ['foo', 'bar'])
    assert.onlyProperties({ foo: 1 }, { foo: 30 })
    assert.onlyProperties({ foo: 1, bar: 2 }, { foo: 6, bar: 7 })

    assert.properties({ foo: 1, bar: 2, baz: 3 }, ['foo', 'bar'])
    assert.properties({ foo: 1, bar: 2, baz: 3 }, ['bar', 'foo'])
    assert.properties({ foo: 1, bar: 2, baz: 3 }, ['baz'])
    assert.properties({ foo: 1, bar: 2 }, ['foo'])
    assert.properties({ foo: 1, bar: 2 }, ['bar'])
    assert.properties({ foo: 1, bar: 2 }, { foo: 6 })
    assert.properties({ foo: 1, bar: 2 }, { bar: 7 })
    assert.properties({ foo: 1, bar: 2 }, { foo: 6 })
    assert.properties({ foo: 1, bar: 2 }, { bar: 7, foo: 6 })

    assert.notAllProperties({ foo: 1, bar: 2 }, ['baz'])
    assert.notAllProperties({ foo: 1, bar: 2 }, ['foo'])
    assert.notAllProperties({ foo: 1, bar: 2 }, ['foo', 'baz'])
    assert.notAllProperties({ foo: 1, bar: 2, baz: 3 }, ['foo', 'bar', 'baz', 'fake'])
    assert.notAllProperties({ foo: 1, bar: 2 }, ['baz', 'foo'])
    assert.notAllProperties({ foo: 1, bar: 2 }, { baz: 8 })
    assert.notAllProperties({ foo: 1, bar: 2 }, { baz: 8, foo: 7 })
    assert.notAllProperties({ foo: 1, bar: 2 }, { baz: 8, fake: 7 })

    assert.anyProperties({ foo: 1, bar: 2 }, ['foo', 'baz'])
    assert.anyProperties({ foo: 1, bar: 2 }, ['foo'])
    assert.anyProperties({ foo: 1, bar: 2 }, ['bar', 'baz'])
    assert.anyProperties({ foo: 1, bar: 2 }, ['bar', 'foo'])
    assert.anyProperties({ foo: 1, bar: 2 }, ['foo', 'bar'])
    assert.anyProperties({ foo: 1, bar: 2 }, ['baz', 'fake', 'foo'])
    assert.anyProperties({ foo: 1, bar: 2 }, { foo: 6 })
    assert.anyProperties({ foo: 1, bar: 2 }, { baz: 6, foo: 12 })

    assert.notAnyProperties({ foo: 1, bar: 2 }, ['baz', 'abc', 'def'])
    assert.notAnyProperties({ foo: 1, bar: 2 }, ['baz'])
    assert.notAnyProperties({ foo: 1, bar: 2 }, { baz: 1, biz: 2, fake: 3 })
    assert.notAnyProperties({ foo: 1, bar: 2 }, { baz: 1 })

    const enumProp1 = 'enumProp1'
    const enumProp2 = 'enumProp2'
    const nonEnumProp = 'nonEnumProp'
    const obj1: any = {}

    obj1[enumProp1] = 'enumProp1'
    obj1[enumProp2] = 'enumProp2'

    Object.defineProperty(obj1, nonEnumProp, {
      enumerable: false,
      value: 'nonEnumProp',
    })

    assert.onlyProperties(obj1, [enumProp1, enumProp2])
    assert.notAllProperties(obj1, [enumProp1, enumProp2, nonEnumProp])
    assert.notAllProperties({ id: 1, name: 'foo' }, ['id', 'name', 'email'])

    if (typeof Symbol === 'function') {
      const sym1 = Symbol('sym1')
      const sym2 = Symbol('sym2')
      const sym3 = Symbol('sym3')
      const str = 'str'
      const obj = {}

      obj[sym1] = 'sym1'
      obj[sym2] = 'sym2'
      obj[str] = 'str'

      Object.defineProperty(obj, sym3, {
        enumerable: false,
        value: 'sym3',
      })

      assert.onlyProperties(obj, [sym1, sym2, str])
      assert.notAllProperties(obj, [sym1, sym2, sym3, str])
    }

    if (typeof Map !== 'undefined') {
      // Not using Map constructor args because not supported in IE 11.
      const aKey = { thisIs: 'anExampleObject' }
      const anotherKey = { doingThisBecauseOf: 'referential equality' }
      const testMap = new Map()

      testMap.set(aKey, 'aValue')
      testMap.set(anotherKey, 'anotherValue')

      assert.anyProperties(testMap, [aKey])
      assert.anyProperties(testMap, ['thisDoesNotExist', 'thisToo', aKey])
      assert.onlyProperties(testMap, [aKey, anotherKey])

      assert.properties(testMap, [aKey])
      assert.notAllProperties(testMap, [aKey, { iDoNot: 'exist' }])

      assert.notAnyProperties(testMap, [{ iDoNot: 'exist' }])
      assert.notAnyProperties(testMap, ['thisDoesNotExist', 'thisToo', { iDoNot: 'exist' }])
      assert.notAllProperties(testMap, ['thisDoesNotExist', 'thisToo', anotherKey])

      assert.notAnyProperties(testMap, [{ iDoNot: 'exist' }, 'thisDoesNotExist'])
      assert.notAnyProperties(testMap, ['thisDoesNotExist', 'thisToo', { iDoNot: 'exist' }])
      assert.notAllProperties(testMap, [aKey, { iDoNot: 'exist' }])

      // Ensure the assertions above use strict equality
      assert.notAnyProperties(testMap, { thisIs: 'anExampleObject' })
      assert.notAllProperties(testMap, [
        { thisIs: 'anExampleObject' },
        { doingThisBecauseOf: 'referential equality' },
      ])

      expectError(function () {
        assert.anyProperties(testMap, [{ thisIs: 'anExampleObject' }])
      })

      expectError(function () {
        assert.onlyProperties(testMap, [
          { thisIs: 'anExampleObject' },
          { doingThisBecauseOf: 'referential equality' },
        ])
      })

      expectError(function () {
        assert.properties(testMap, [{ thisIs: 'anExampleObject' }])
      })

      const weirdMapKey1 = Object.create(null)
      const weirdMapKey2 = { toString: NaN }
      const weirdMapKey3 = []
      const weirdMap = new Map()

      weirdMap.set(weirdMapKey1, 'val1')
      weirdMap.set(weirdMapKey2, 'val2')

      assert.onlyProperties(weirdMap, [weirdMapKey1, weirdMapKey2])
      assert.notAllProperties(weirdMap, [weirdMapKey1, weirdMapKey3])

      if (typeof Symbol === 'function') {
        const symMapKey1 = Symbol()
        const symMapKey2 = Symbol()
        const symMapKey3 = Symbol()
        const symMap = new Map()

        symMap.set(symMapKey1, 'val1')
        symMap.set(symMapKey2, 'val2')

        assert.onlyProperties(symMap, [symMapKey1, symMapKey2])
        assert.anyProperties(symMap, [symMapKey1, symMapKey3])
        assert.properties(symMap, [symMapKey2, symMapKey1])

        assert.notAllProperties(symMap, [symMapKey1, symMapKey3])
        assert.notAnyProperties(symMap, [symMapKey3])
      }

      const errMap = new Map()

      errMap.set({ 1: 20 }, 'number')

      expectError(function () {
        assert.onlyProperties(errMap, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.properties(errMap, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.notAllProperties(errMap, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.anyProperties(errMap, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.notAnyProperties(errMap, [], 'blah')
      }, 'blah: keys required')
    }

    if (typeof Set !== 'undefined') {
      const aKey = { thisIs: 'anExampleObject' }
      const anotherKey = { doingThisBecauseOf: 'referential equality' }
      const testSet = new Set()

      testSet.add(aKey)
      testSet.add(anotherKey)

      assert.anyProperties(testSet, [aKey])
      assert.anyProperties(testSet, [20, 1, aKey])
      assert.onlyProperties(testSet, [aKey, anotherKey])

      assert.properties(testSet, [aKey])
      assert.notAllProperties(testSet, [aKey, { iDoNot: 'exist' }])

      assert.notAnyProperties(testSet, [{ iDoNot: 'exist' }])
      assert.notAnyProperties(testSet, ['thisDoesNotExist', 'thisToo', { iDoNot: 'exist' }])
      assert.notAllProperties(testSet, ['thisDoesNotExist', 'thisToo', anotherKey])

      assert.notAnyProperties(testSet, [{ iDoNot: 'exist' }, 'thisDoesNotExist'])
      assert.notAnyProperties(testSet, [20, 1, { iDoNot: 'exist' }])
      assert.notAllProperties(testSet, ['thisDoesNotExist', 'thisToo', { iDoNot: 'exist' }])

      // Ensure the assertions above use strict equality
      assert.notAnyProperties(testSet, { thisIs: 'anExampleObject' })
      assert.notAllProperties(testSet, [
        { thisIs: 'anExampleObject' },
        { doingThisBecauseOf: 'referential equality' },
      ])

      expectError(function () {
        assert.anyProperties(testSet, [{ thisIs: 'anExampleObject' }])
      })

      expectError(function () {
        assert.onlyProperties(testSet, [
          { thisIs: 'anExampleObject' },
          { doingThisBecauseOf: 'referential equality' },
        ])
      })

      expectError(function () {
        assert.properties(testSet, [{ thisIs: 'anExampleObject' }])
      })

      const weirdSetKey1 = Object.create(null)
      const weirdSetKey2 = { toString: NaN }
      const weirdSetKey3 = []
      const weirdSet = new Set()

      weirdSet.add(weirdSetKey1)
      weirdSet.add(weirdSetKey2)

      assert.onlyProperties(weirdSet, [weirdSetKey1, weirdSetKey2])
      assert.notAllProperties(weirdSet, [weirdSetKey1, weirdSetKey3])

      if (typeof Symbol === 'function') {
        const symSetKey1 = Symbol()
        const symSetKey2 = Symbol()
        const symSetKey3 = Symbol()
        const symSet = new Set()

        symSet.add(symSetKey1)
        symSet.add(symSetKey2)

        assert.onlyProperties(symSet, [symSetKey1, symSetKey2])
        assert.anyProperties(symSet, [symSetKey1, symSetKey3])
        assert.properties(symSet, [symSetKey2, symSetKey1])

        assert.notAllProperties(symSet, [symSetKey1, symSetKey3])
        assert.notAnyProperties(symSet, [symSetKey3])
      }

      const errSet = new Set()

      errSet.add({ 1: 20 })
      errSet.add('number')

      expectError(function () {
        assert.onlyProperties(errSet, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.properties(errSet, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.notAllProperties(errSet, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.anyProperties(errSet, [], 'blah')
      }, 'blah: keys required')

      expectError(function () {
        assert.notAnyProperties(errSet, [], 'blah')
      }, 'blah: keys required')
    }

    expectError(function () {
      assert.onlyProperties({ foo: 1 }, [], 'blah')
    }, 'blah: keys required')

    expectError(function () {
      assert.properties({ foo: 1 }, [], 'blah')
    }, 'blah: keys required')

    expectError(function () {
      assert.notAllProperties({ foo: 1 }, [], 'blah')
    }, 'blah: keys required')

    expectError(function () {
      assert.anyProperties({ foo: 1 }, [], 'blah')
    }, 'blah: keys required')

    expectError(function () {
      assert.notAnyProperties({ foo: 1 }, [], 'blah')
    }, 'blah: keys required')

    expectError(function () {
      assert.onlyProperties({ foo: 1 }, ['bar'], 'blah')
    }, "blah: expected { foo: 1 } to have key 'bar'")

    expectError(function () {
      assert.onlyProperties({ foo: 1 }, ['bar', 'baz'])
    }, "expected { foo: 1 } to have keys 'bar', and 'baz'")

    expectError(function () {
      assert.onlyProperties({ foo: 1 }, ['foo', 'bar', 'baz'])
    }, "expected { foo: 1 } to have keys 'foo', 'bar', and 'baz'")

    expectError(function () {
      assert.notAllProperties({ foo: 1 }, ['foo'], 'blah')
    }, "blah: expected { foo: 1 } to not have key 'foo'")

    expectError(function () {
      assert.notAllProperties({ foo: 1, bar: 2 }, ['foo', 'bar'])
    }, "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'")

    expectError(function () {
      assert.onlyProperties({ foo: 1, bar: 2 }, ['foo'])
    }, "expected { foo: 1, bar: 2 } to have key 'foo'")

    expectError(function () {
      assert.properties({ foo: 1 }, ['foo', 'bar'], 'blah')
    }, "blah: expected { foo: 1 } to contain keys 'foo', and 'bar'")

    expectError(function () {
      assert.anyProperties({ foo: 1 }, ['baz'], 'blah')
    }, "blah: expected { foo: 1 } to have key 'baz'")

    expectError(function () {
      assert.notAllProperties({ foo: 1, bar: 2 }, ['foo', 'bar'])
    }, "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'")

    expectError(function () {
      assert.notAnyProperties({ foo: 1, bar: 2 }, ['foo', 'baz'], 'blah')
    }, "blah: expected { foo: 1, bar: 2 } to not have keys 'foo', or 'baz'")

    // repeat previous tests with Object as arg.
    expectError(function () {
      assert.onlyProperties({ foo: 1 }, { bar: 1 }, 'blah')
    }, "blah: expected { foo: 1 } to have key 'bar'")

    expectError(function () {
      assert.onlyProperties({ foo: 1 }, { bar: 1, baz: 1 })
    }, "expected { foo: 1 } to have keys 'bar', and 'baz'")

    expectError(function () {
      assert.onlyProperties({ foo: 1 }, { foo: 1, bar: 1, baz: 1 })
    }, "expected { foo: 1 } to have keys 'foo', 'bar', and 'baz'")

    expectError(function () {
      assert.notAllProperties({ foo: 1 }, { foo: 1 }, 'blah')
    }, "blah: expected { foo: 1 } to not have key 'foo'")

    expectError(function () {
      assert.notAllProperties({ foo: 1 }, { foo: 1 })
    }, "expected { foo: 1 } to not have key 'foo'")

    expectError(function () {
      assert.notAllProperties({ foo: 1, bar: 2 }, { foo: 1, bar: 1 })
    }, "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'")

    expectError(function () {
      assert.anyProperties({ foo: 1 }, 'baz' as any, 'blah')
    }, "blah: expected { foo: 1 } to have key 'baz'")

    expectError(function () {
      assert.notAllProperties({ foo: 1, bar: 2 }, { foo: 1, bar: 1 })
    }, "expected { foo: 1, bar: 2 } to not have keys 'foo', and 'bar'")

    expectError(function () {
      assert.notAnyProperties({ foo: 1, bar: 2 }, { foo: 1, baz: 1 }, 'blah')
    }, "blah: expected { foo: 1, bar: 2 } to not have keys 'foo', or 'baz'")
  })

  test('lengthOf', function () {
    const assert = new Assert()

    assert.lengthOf([1, 2, 3], 3)
    assert.lengthOf('foobar', 6)

    expectError(function () {
      assert.lengthOf('foobar', 5, 'blah')
    }, "blah: expected 'foobar' to have a length of 5 but got 6")

    expectError(function () {
      assert.lengthOf(1 as any, 5)
    }, "expected 1 to have property 'length'")

    if (typeof Map === 'function') {
      assert.lengthOf(new Map(), 0)

      const map = new Map()
      map.set('a', 1)
      map.set('b', 2)
      assert.lengthOf(map, 2)

      expectError(function () {
        assert.lengthOf(map, 3, 'blah')
      }, 'blah: expected {} to have a size of 3 but got 2')
    }

    if (typeof Set === 'function') {
      assert.lengthOf(new Set(), 0)

      var set = new Set()
      set.add(1)
      set.add(2)

      assert.lengthOf(set, 2)

      expectError(function () {
        assert.lengthOf(set, 3, 'blah')
      }, 'blah: expected {} to have a size of 3 but got 2')
    }
  })

  test('match', function () {
    const assert = new Assert()

    assert.match('foobar', /^foo/)
    assert.notMatch('foobar', /^bar/)

    expectError(function () {
      assert.match('foobar', /^bar/i, 'blah')
    }, "blah: expected 'foobar' to match /^bar/i")

    expectError(function () {
      assert.notMatch('foobar', /^foo/i, 'blah')
    }, "blah: expected 'foobar' not to match /^foo/i")
  })

  test('property', function () {
    const assert = new Assert()

    const obj = { foo: { bar: 'baz' } }
    const simpleObj = { foo: 'bar' }
    const undefinedKeyObj = { foo: undefined }
    const dummyObj = { a: '1' }

    assert.property(obj, 'foo')
    assert.property(obj, 'toString')
    assert.propertyVal(obj, 'toString', Object.prototype.toString)
    assert.property(undefinedKeyObj, 'foo')
    assert.propertyVal(undefinedKeyObj, 'foo', undefined)
    assert.property(obj, 'foo.bar')
    assert.notProperty(obj, 'baz')
    assert.notProperty(obj, 'foo.baz')
    assert.notPropertyVal(simpleObj, 'foo', 'flow')
    assert.notPropertyVal(simpleObj, 'flow', 'bar')
    assert.notPropertyVal(obj, 'foo', { bar: 'baz' })
    assert.notProperty(obj, 'foo.baz')
    assert.property(obj, 'foo.bar', 'baz')
    assert.notPropertyVal(obj, 'foo.bar', 'flow')
    assert.notPropertyVal(obj, 'foo.flow', 'baz')

    expectError(function () {
      assert.property(obj, 'baz', 'blah')
    }, "blah: expected { foo: { bar: 'baz' } } to have nested property 'baz'")

    expectError(function () {
      assert.property(obj, 'foo.baz', 'blah')
    }, "blah: expected { foo: { bar: 'baz' } } to have nested property 'foo.baz'")

    expectError(function () {
      assert.notProperty(obj, 'foo', 'blah')
    }, "blah: expected { foo: { bar: 'baz' } } to not have nested property 'foo'")

    expectError(function () {
      assert.notProperty(obj, 'foo.bar', 'blah')
    }, "blah: expected { foo: { bar: 'baz' } } to not have nested property 'foo.bar'")

    expectError(function () {
      assert.propertyVal(simpleObj, 'foo', 'ball', 'blah')
    }, "blah: expected { foo: 'bar' } to have nested property 'foo' of 'ball', but got 'bar'")

    expectError(function () {
      assert.propertyVal(simpleObj, 'foo', undefined)
    }, "expected { foo: 'bar' } to have nested property 'foo' of undefined, but got 'bar'")

    expectError(function () {
      assert.propertyVal(obj, 'foo.bar', 'ball', 'blah')
    }, "blah: expected { foo: { bar: 'baz' } } to have nested property 'foo.bar' of 'ball', but got 'baz'")

    expectError(function () {
      assert.notPropertyVal(simpleObj, 'foo', 'bar', 'blah')
    }, "blah: expected { foo: 'bar' } to not have nested property 'foo' of 'bar'")

    expectError(function () {
      assert.notPropertyVal(obj, 'foo.bar', 'baz', 'blah')
    }, "blah: expected { foo: { bar: 'baz' } } to not have nested property 'foo.bar' of 'baz'")

    expectError(function () {
      assert.property(null, 'a', 'blah')
    }, 'blah: Target cannot be null or undefined.')

    expectError(function () {
      assert.property(undefined, 'a', 'blah')
    }, 'blah: Target cannot be null or undefined.')

    expectError(function () {
      assert.property({ a: 1 }, { a: '1' } as any, 'blah')
    }, 'blah: the argument to property must be a string when using nested syntax')

    expectError(function () {
      assert.propertyVal(dummyObj, 'a', '2', 'blah')
    }, "blah: expected { a: '1' } to have nested property 'a' of '2', but got '1'")

    expectError(function () {
      assert.property({ a: 1 }, { a: '1' } as any, 'blah')
    }, 'blah: the argument to property must be a string when using nested syntax')
  })

  test('deepPropertyVal', function () {
    const assert = new Assert()
    const obj = { a: { b: 1 } }

    assert.deepPropertyVal(obj, 'a', { b: 1 })
    assert.notDeepPropertyVal(obj, 'a', { b: 7 })
    assert.notDeepPropertyVal(obj, 'a', { z: 1 })
    assert.notDeepPropertyVal(obj, 'z', { b: 1 })

    expectError(function () {
      assert.deepPropertyVal(obj, 'a', { b: 7 }, 'blah')
    }, "blah: expected { a: { b: 1 } } to have deep nested property 'a' of { b: 7 }, but got { b: 1 }")

    expectError(function () {
      assert.deepPropertyVal(obj, 'z', { b: 1 }, 'blah')
    }, "blah: expected { a: { b: 1 } } to have deep nested property 'z'")

    expectError(function () {
      assert.notDeepPropertyVal(obj, 'a', { b: 1 }, 'blah')
    }, "blah: expected { a: { b: 1 } } to not have deep nested property 'a' of { b: 1 }")
  })

  test('ownProperty', function () {
    const assert = new Assert()
    const coffeeObj = { coffee: 'is good' }

    // This has length = 17
    const teaObj = 'but tea is better'

    assert.ownProperty(coffeeObj, 'coffee')
    assert.ownProperty(teaObj, 'length')

    assert.ownPropertyVal(coffeeObj, 'coffee', 'is good')
    assert.ownPropertyVal(teaObj, 'length', 17)

    assert.notOwnProperty(coffeeObj, 'length')
    assert.notOwnProperty(coffeeObj, 'toString')
    assert.notOwnProperty(teaObj, 'calories')

    assert.notOwnPropertyVal(coffeeObj, 'coffee', 'is bad')
    assert.notOwnPropertyVal(teaObj, 'length', 1)
    assert.notOwnPropertyVal(coffeeObj, 'toString', Object.prototype.toString)
    assert.notOwnPropertyVal({ a: { b: 1 } }, 'a', { b: 1 })

    expectError(function () {
      assert.ownProperty(coffeeObj, 'calories', 'blah')
    }, "blah: expected { coffee: 'is good' } to have own property 'calories'")

    expectError(function () {
      assert.notOwnProperty(coffeeObj, 'coffee', 'blah')
    }, "blah: expected { coffee: 'is good' } to not have own property 'coffee'")

    expectError(function () {
      assert.ownPropertyVal(teaObj, 'length', 1, 'blah')
    }, "blah: expected 'but tea is better' to have own property 'length' of 1, but got 17")

    expectError(function () {
      assert.notOwnPropertyVal(teaObj, 'length', 17, 'blah')
    }, "blah: expected 'but tea is better' to not have own property 'length' of 17")

    expectError(function () {
      assert.ownPropertyVal(teaObj, 'calories', 17)
    }, "expected 'but tea is better' to have own property 'calories'")

    expectError(function () {
      assert.ownPropertyVal(teaObj, 'calories', 17)
    }, "expected 'but tea is better' to have own property 'calories'")
  })

  test('deepOwnPropertyVal', function () {
    const assert = new Assert()
    const obj = { a: { b: 1 } }

    assert.deepOwnPropertyVal(obj, 'a', { b: 1 })
    assert.notDeepOwnPropertyVal(obj, 'a', { z: 1 })
    assert.notDeepOwnPropertyVal(obj, 'a', { b: 7 })
    assert.notDeepOwnPropertyVal(obj, 'toString', Object.prototype.toString)

    expectError(function () {
      assert.deepOwnPropertyVal(obj, 'a', { z: 7 }, 'blah')
    }, "blah: expected { a: { b: 1 } } to have deep own property 'a' of { z: 7 }, but got { b: 1 }")

    expectError(function () {
      assert.deepOwnPropertyVal(obj, 'z', { b: 1 }, 'blah')
    }, "blah: expected { a: { b: 1 } } to have deep own property 'z'")

    expectError(function () {
      assert.notDeepOwnPropertyVal(obj, 'a', { b: 1 }, 'blah')
    }, "blah: expected { a: { b: 1 } } to not have deep own property 'a' of { b: 1 }")
  })

  test('deepNestedPropertyVal', function () {
    const assert = new Assert()
    const obj = { a: { b: { c: 1 } } }

    assert.deepPropertyVal(obj, 'a.b', { c: 1 })
    assert.notDeepPropertyVal(obj, 'a.b', { c: 7 })
    assert.notDeepPropertyVal(obj, 'a.b', { z: 1 })
    assert.notDeepPropertyVal(obj, 'a.z', { c: 1 })

    expectError(function () {
      assert.deepPropertyVal(obj, 'a.b', { c: 7 }, 'blah')
    }, "blah: expected { a: { b: { c: 1 } } } to have deep nested property 'a.b' of { c: 7 }, but got { c: 1 }")

    expectError(function () {
      assert.deepPropertyVal(obj, 'a.z', { c: 1 }, 'blah')
    }, "blah: expected { a: { b: { c: 1 } } } to have deep nested property 'a.z'")

    expectError(function () {
      assert.notDeepPropertyVal(obj, 'a.b', { c: 1 }, 'blah')
    }, "blah: expected { a: { b: { c: 1 } } } to not have deep nested property 'a.b' of { c: 1 }")
  })

  test('throws', function () {
    const assert = new Assert()

    assert.throws(function () {
      throw new Error('foo')
    })
    assert.throws(function () {
      throw new Error('')
    }, '')
    assert.throws(function () {
      throw new Error('bar')
    }, 'bar')
    assert.throws(function () {
      throw new Error('bar')
    }, /bar/)
    assert.throws(function () {
      throw new Error('bar')
    }, Error)
    assert.throws(
      function () {
        throw new Error('bar')
      },
      Error,
      'bar'
    )
    assert.throws(
      function () {
        throw new Error('')
      },
      Error,
      ''
    )
    assert.throws(function () {
      throw new Error('foo')
    }, '')

    expectError(function () {
      assert.throws(function () {
        throw new Error('foo')
      }, TypeError)
    }, "expected [Function] to throw 'TypeError' but 'Error: foo' was thrown")

    expectError(function () {
      assert.throws(function () {
        throw new Error('foo')
      }, 'bar')
    }, "expected [Function] to throw error including 'bar' but got 'foo'")

    expectError(function () {
      assert.throws(
        function () {
          throw new Error('foo')
        },
        Error,
        'bar',
        'blah'
      )
    }, "blah: expected [Function] to throw error including 'bar' but got 'foo'")

    expectError(function () {
      assert.throws(
        function () {
          throw new Error('foo')
        },
        TypeError,
        'bar',
        'blah'
      )
    }, "blah: expected [Function] to throw 'TypeError' but 'Error: foo' was thrown")

    expectError(function () {
      assert.throws(function () {})
    }, 'expected [Function] to throw an error')

    expectError(function () {
      assert.throws(function () {
        throw new Error('')
      }, 'bar')
    }, "expected [Function] to throw error including 'bar' but got ''")

    expectError(function () {
      assert.throws(function () {
        throw new Error('')
      }, /bar/)
    }, "expected [Function] to throw error matching /bar/ but got ''")

    expectError(function () {
      assert.throws({} as any)
    }, 'expected {} to be a function')

    expectError(function () {
      assert.throws({} as any, Error, 'testing', 'blah')
    }, 'blah: expected {} to be a function')
  })

  test('rejects', async function () {
    const assert = new Assert()

    await assert.rejects(async function () {
      throw new Error('foo')
    })
    await assert.rejects(async function () {
      throw new Error('')
    }, '')
    await assert.rejects(async function () {
      throw new Error('bar')
    }, 'bar')
    await assert.rejects(async function () {
      throw new Error('bar')
    }, /bar/)
    await assert.rejects(async function () {
      throw new Error('bar')
    }, Error)
    await assert.rejects(
      function () {
        throw new Error('bar')
      },
      Error,
      'bar'
    )
    await assert.rejects(
      function () {
        throw new Error('')
      },
      Error,
      ''
    )
    await assert.rejects(async function () {
      throw new Error('foo')
    }, '')

    await expectAsyncError(async function () {
      await assert.rejects(async function () {
        throw new Error('foo')
      }, TypeError)
    }, 'expected [Function] to throw [Function: TypeError] but [Error: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.rejects(async function () {
        throw new Error('foo')
      }, 'bar')
    }, "expected [Function] to throw error including 'bar' but got 'foo'")

    await expectAsyncError(async function () {
      await assert.rejects(
        async function () {
          throw new Error('foo')
        },
        Error,
        'bar',
        'blah'
      )
    }, "blah: expected [Function] to throw error including 'bar' but got 'foo'")

    await expectAsyncError(async function () {
      await assert.rejects(
        async function () {
          throw new Error('foo')
        },
        TypeError,
        'bar',
        'blah'
      )
    }, 'blah: expected [Function] to throw [Function: TypeError] but [Error: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.rejects(async function () {})
    }, 'expected [Function] to throw an error')

    await expectAsyncError(async function () {
      await assert.rejects(async function () {
        throw new Error('')
      }, 'bar')
    }, "expected [Function] to throw error including 'bar' but got ''")

    await expectAsyncError(async function () {
      await assert.rejects(async function () {
        throw new Error('')
      }, /bar/)
    }, "expected [Function] to throw error matching /bar/ but got ''")

    await expectAsyncError(async function () {
      await assert.rejects({} as any)
    }, 'expected {} to be a function')

    await expectAsyncError(async function () {
      await assert.rejects({} as any, Error, 'testing', 'blah')
    }, 'blah: expected {} to be a function')
  })

  test('doesNotThrows', function () {
    const assert = new Assert()

    class CustomError extends Error {
      public name = 'CustomError'
    }

    assert.doesNotThrows(function () {})
    assert.doesNotThrows(function () {}, 'foo')
    assert.doesNotThrows(function () {}, '')

    assert.doesNotThrows(function () {
      throw new Error('This is a message')
    }, TypeError)

    assert.doesNotThrows(function () {
      throw new Error('This is a message')
    }, 'Another message')

    assert.doesNotThrows(function () {
      throw new Error('This is a message')
    }, /Another message/)

    assert.doesNotThrows(
      function () {
        throw new Error('This is a message')
      },
      Error,
      'Another message'
    )

    assert.doesNotThrows(
      function () {
        throw new Error('This is a message')
      },
      Error,
      /Another message/
    )

    assert.doesNotThrows(
      function () {
        throw new Error('This is a message')
      },
      TypeError,
      'Another message'
    )

    assert.doesNotThrows(
      function () {
        throw new Error('This is a message')
      },
      TypeError,
      /Another message/
    )

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new Error('foo')
      })
    }, "expected [Function] to not throw an error but 'Error: foo' was thrown")

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new CustomError('foo')
      })
    }, "expected [Function] to not throw an error but 'CustomError: foo' was thrown")

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new Error('foo')
      }, Error)
    }, "expected [Function] to not throw 'Error' but 'Error: foo' was thrown")

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new CustomError('foo')
      }, CustomError as any)
    }, "expected [Function] to not throw 'CustomError' but 'CustomError: foo' was thrown")

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new Error('foo')
      }, 'foo')
    }, "expected [Function] to throw error not including 'foo'")

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new Error('foo')
      }, /foo/)
    }, 'expected [Function] to throw error not matching /foo/')

    expectError(function () {
      assert.doesNotThrows(
        function () {
          throw new Error('foo')
        },
        Error,
        'foo',
        'blah'
      )
    }, "blah: expected [Function] to not throw 'Error' but 'Error: foo' was thrown")

    expectError(function () {
      assert.doesNotThrows(
        function () {
          throw new CustomError('foo')
        },
        CustomError as ErrorConstructor,
        'foo',
        'blah'
      )
    }, "blah: expected [Function] to not throw 'CustomError' but 'CustomError: foo' was thrown")

    expectError(function () {
      assert.doesNotThrows(function () {
        throw new Error('')
      }, '')
    }, "expected [Function] to throw error not including ''")

    expectError(function () {
      assert.doesNotThrows(
        function () {
          throw new Error('')
        },
        Error,
        ''
      )
    }, "expected [Function] to not throw 'Error' but 'Error' was thrown")

    expectError(function () {
      assert.doesNotThrows({} as any)
    }, 'expected {} to be a function')

    expectError(function () {
      assert.doesNotThrows({} as any, Error, '', 'blah')
    }, 'blah: expected {} to be a function')
  })

  test('doesNotRejects', async function () {
    const assert = new Assert()

    class CustomError extends Error {
      public name = 'CustomError'
    }

    await assert.doesNotRejects(async function () {})
    await assert.doesNotRejects(async function () {}, 'foo')
    await assert.doesNotRejects(async function () {}, '')

    await assert.doesNotRejects(async function () {
      throw new Error('This is a message')
    }, TypeError)

    await assert.doesNotRejects(async function () {
      throw new Error('This is a message')
    }, 'Another message')

    await assert.doesNotRejects(async function () {
      throw new Error('This is a message')
    }, /Another message/)

    await assert.doesNotRejects(
      async function () {
        throw new Error('This is a message')
      },
      Error,
      'Another message'
    )

    await assert.doesNotRejects(
      async function () {
        throw new Error('This is a message')
      },
      Error,
      /Another message/
    )

    await assert.doesNotRejects(
      async function () {
        throw new Error('This is a message')
      },
      TypeError,
      'Another message'
    )

    await assert.doesNotRejects(
      async function () {
        throw new Error('This is a message')
      },
      TypeError,
      /Another message/
    )

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new Error('foo')
      })
    }, 'expected [Function] to not throw an error but [Error: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new CustomError('foo')
      })
    }, 'expected [Function] to not throw an error but [CustomError: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new Error('foo')
      }, Error)
    }, 'expected [Function] to not throw [Function: Error] but [Error: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new CustomError('foo')
      }, CustomError as any)
    }, 'expected [Function] to not throw [Function: CustomError] but [CustomError: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new Error('foo')
      }, 'foo')
    }, "expected [Function] to throw error not including 'foo'")

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new Error('foo')
      }, /foo/)
    }, 'expected [Function] to throw error not matching /foo/')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(
        async function () {
          throw new Error('foo')
        },
        Error,
        'foo',
        'blah'
      )
    }, 'blah: expected [Function] to not throw [Function: Error] but [Error: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(
        async function () {
          throw new CustomError('foo')
        },
        CustomError as ErrorConstructor,
        'foo',
        'blah'
      )
    }, 'blah: expected [Function] to not throw [Function: CustomError] but [CustomError: foo] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(async function () {
        throw new Error('')
      }, '')
    }, 'expected [Function] to not throw an error but [Error] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects(
        async function () {
          throw new Error('')
        },
        Error,
        ''
      )
    }, 'expected [Function] to not throw [Function: Error] but [Error] was thrown')

    await expectAsyncError(async function () {
      await assert.doesNotRejects({} as any)
    }, 'expected {} to be a function')

    await expectAsyncError(async function () {
      await assert.doesNotRejects({} as any, Error, '', 'blah')
    }, 'blah: expected {} to be a function')
  })

  test('closeTo', function () {
    const assert = new Assert()

    assert.closeTo(1.5, 1.0, 0.5)
    assert.closeTo(1.5, 1.0, 0.8)
    assert.closeTo(10, 20, 20)
    assert.closeTo(-10, 20, 30)

    expectError(function () {
      assert.closeTo(2, 1.0, 0.5, 'blah')
    }, 'blah: expected 2 to be close to 1 +/- 0.5')

    expectError(function () {
      assert.closeTo(-10, 20, 29)
    }, 'expected -10 to be close to 20 +/- 29')

    expectError(function () {
      assert.closeTo([1.5] as any, 1.0, 0.5, 'blah')
    }, 'blah: expected [ 1.5 ] to be a number')

    expectError(function () {
      assert.closeTo(1.5, '1.0' as any, 0.5, 'blah')
    }, 'blah: the arguments to closeTo or approximately must be numbers')

    expectError(function () {
      assert.closeTo(1.5, 1.0, true as any, 'blah')
    }, 'blah: the arguments to closeTo or approximately must be numbers')

    expectError(function () {
      assert.closeTo(1.5, 1.0, undefined as any, 'blah')
    }, 'blah: the arguments to closeTo or approximately must be numbers, and a delta is required')
  })

  test('approximately', function () {
    const assert = new Assert()

    assert.approximately(1.5, 1.0, 0.5)
    assert.approximately(10, 20, 20)
    assert.approximately(-10, 20, 30)

    expectError(function () {
      assert.approximately(2, 1.0, 0.5, 'blah')
    }, 'blah: expected 2 to be close to 1 +/- 0.5')

    expectError(function () {
      assert.approximately(-10, 20, 29)
    }, 'expected -10 to be close to 20 +/- 29')

    expectError(function () {
      assert.approximately([1.5] as any, 1.0, 0.5)
    }, 'expected [ 1.5 ] to be a number')

    expectError(function () {
      assert.approximately(1.5, '1.0' as any, 0.5, 'blah')
    }, 'blah: the arguments to closeTo or approximately must be numbers')

    expectError(function () {
      assert.approximately(1.5, 1.0, true as any, 'blah')
    }, 'blah: the arguments to closeTo or approximately must be numbers')

    expectError(function () {
      assert.approximately(1.5, 1.0, undefined as any, 'blah')
    }, 'blah: the arguments to closeTo or approximately must be numbers, and a delta is required')
  })

  test('sameMembers', function () {
    const assert = new Assert()

    assert.sameMembers([], [])
    assert.sameMembers([1, 2, 3], [3, 2, 1])
    assert.sameMembers([4, 2], [4, 2])
    assert.sameMembers([4, 2, 2], [4, 2, 2])

    expectError(function () {
      assert.sameMembers([], [1, 2], 'blah')
    }, 'blah: expected [] to have the same members as [ 1, 2 ]')

    expectError(function () {
      assert.sameMembers([1, 54], [6, 1, 54])
    }, 'expected [ 1, 54 ] to have the same members as [ 6, 1, 54 ]')

    expectError(function () {
      assert.sameMembers([1, { id: 1 }, 3], [1, { id: 1 }, 3])
    }, 'expected [ 1, { id: 1 }, 3 ] to have the same members as [ 1, { id: 1 }, 3 ]')

    expectError(function () {
      assert.sameMembers({} as any, [], 'blah')
    }, 'blah: expected {} to be an array')

    expectError(function () {
      assert.sameMembers([], {} as any, 'blah')
    }, 'blah: expected {} to be an array')
  })

  test('notSameMembers', function () {
    const assert = new Assert()

    assert.notSameMembers([1, 2, 3], [2, 1, 5])
    assert.notSameMembers([1, 2, 3], [1, 2, 3, 3])
    assert.notSameMembers([1, 2], [1, 2, 2])
    assert.notSameMembers([1, 2, 2], [1, 2])
    assert.notSameMembers([1, 2, 2], [1, 2, 3])
    assert.notSameMembers([1, 2, 3], [1, 2, 2])
    assert.notSameMembers([{ a: 1 }], [{ a: 1 }])

    expectError(function () {
      assert.notSameMembers([1, 2, 3], [2, 1, 3], 'blah')
    }, 'blah: expected [ 1, 2, 3 ] to not have the same members as [ 2, 1, 3 ]')
  })

  test('sameDeepMembers', function () {
    const assert = new Assert()

    assert.sameDeepMembers(
      [{ b: 3 }, { a: 2 }, { c: 5 }],
      [{ c: 5 }, { b: 3 }, { a: 2 }],
      'same deep members'
    )
    assert.sameDeepMembers(
      [{ b: 3 }, { a: 2 }, 5, 'hello'],
      ['hello', 5, { b: 3 }, { a: 2 }],
      'same deep members'
    )
    assert.sameDeepMembers([{ a: 1 }, { b: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { b: 2 }])

    expectError(function () {
      assert.sameDeepMembers([{ b: 3 }], [{ c: 3 }], 'blah')
    }, 'blah: expected [ { b: 3 } ] to have the same members as [ { c: 3 } ]')

    expectError(function () {
      assert.sameDeepMembers([{ b: 3 }], [{ b: 5 }])
    }, 'expected [ { b: 3 } ] to have the same members as [ { b: 5 } ]')
  })

  test('notSameDeepMembers', function () {
    const assert = new Assert()

    assert.notSameDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ b: 2 }, { a: 1 }, { f: 5 }])
    assert.notSameDeepMembers([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { b: 2 }])
    assert.notSameDeepMembers([{ a: 1 }, { b: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }])
    assert.notSameDeepMembers([{ a: 1 }, { b: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { c: 3 }])
    assert.notSameDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { b: 2 }, { b: 2 }])

    expectError(function () {
      assert.notSameDeepMembers(
        [{ a: 1 }, { b: 2 }, { c: 3 }],
        [{ b: 2 }, { a: 1 }, { c: 3 }],
        'blah'
      )
    }, 'blah: expected [ { a: 1 }, { b: 2 }, { c: 3 } ] to not have the same members as [ { b: 2 }, { a: 1 }, { c: 3 } ]')
  })

  test('sameOrderedMembers', function () {
    const assert = new Assert()

    assert.sameOrderedMembers([1, 2, 3], [1, 2, 3])
    assert.sameOrderedMembers([1, 2, 2], [1, 2, 2])

    expectError(function () {
      assert.sameOrderedMembers([1, 2, 3], [2, 1, 3], 'blah')
    }, 'blah: expected [ 1, 2, 3 ] to have the same ordered members as [ 2, 1, 3 ]')
  })

  test('notSameOrderedMembers', function () {
    const assert = new Assert()

    assert.notSameOrderedMembers([1, 2, 3], [2, 1, 3])
    assert.notSameOrderedMembers([1, 2, 3], [1, 2])
    assert.notSameOrderedMembers([1, 2], [1, 2, 2])
    assert.notSameOrderedMembers([1, 2, 2], [1, 2])
    assert.notSameOrderedMembers([1, 2, 2], [1, 2, 3])
    assert.notSameOrderedMembers([1, 2, 3], [1, 2, 2])

    expectError(function () {
      assert.notSameOrderedMembers([1, 2, 3], [1, 2, 3], 'blah')
    }, 'blah: expected [ 1, 2, 3 ] to not have the same ordered members as [ 1, 2, 3 ]')
  })

  test('sameDeepOrderedMembers', function () {
    const assert = new Assert()

    assert.sameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { b: 2 }, { c: 3 }])
    assert.sameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { b: 2 }])

    expectError(function () {
      assert.sameDeepOrderedMembers(
        [{ a: 1 }, { b: 2 }, { c: 3 }],
        [{ b: 2 }, { a: 1 }, { c: 3 }],
        'blah'
      )
    }, 'blah: expected [ { a: 1 }, { b: 2 }, { c: 3 } ] to have the same ordered members as [ { b: 2 }, { a: 1 }, { c: 3 } ]')
  })

  test('notSameDeepOrderedMembers', function () {
    const assert = new Assert()

    assert.notSameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ b: 2 }, { a: 1 }, { c: 3 }])
    assert.notSameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { b: 2 }, { f: 5 }])
    assert.notSameDeepOrderedMembers([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { b: 2 }])
    assert.notSameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }])
    assert.notSameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { b: 2 }], [{ a: 1 }, { b: 2 }, { c: 3 }])
    assert.notSameDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { b: 2 }, { b: 2 }])

    expectError(function () {
      assert.notSameDeepOrderedMembers(
        [{ a: 1 }, { b: 2 }, { c: 3 }],
        [{ a: 1 }, { b: 2 }, { c: 3 }],
        'blah'
      )
    }, 'blah: expected [ { a: 1 }, { b: 2 }, { c: 3 } ] to not have the same ordered members as [ { a: 1 }, { b: 2 }, { c: 3 } ]')
  })

  test('includeMembers', function () {
    const assert = new Assert()

    assert.includeMembers([1, 2, 3], [2, 3, 2])
    assert.includeMembers([1, 2, 3], [])
    assert.includeMembers([1, 2, 3], [3])

    expectError(function () {
      assert.includeMembers([5, 6], [7, 8], 'blah')
    }, 'blah: expected [ 5, 6 ] to be a superset of [ 7, 8 ]')

    expectError(function () {
      assert.includeMembers([5, 6], [5, 6, 0])
    }, 'expected [ 5, 6 ] to be a superset of [ 5, 6, 0 ]')
  })

  test('notIncludeMembers', function () {
    const assert = new Assert()

    assert.notIncludeMembers([1, 2, 3], [5, 1])
    assert.notIncludeMembers([{ a: 1 }], [{ a: 1 }])

    expectError(function () {
      assert.notIncludeMembers([1, 2, 3], [2, 1], 'blah')
    }, 'blah: expected [ 1, 2, 3 ] to not be a superset of [ 2, 1 ]')
  })

  test('includeDeepMembers', function () {
    const assert = new Assert()

    assert.includeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ c: 3 }, { b: 2 }])
    assert.includeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [])
    assert.includeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ c: 3 }])
    assert.includeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }, { c: 3 }], [{ c: 3 }, { c: 3 }])
    assert.includeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ c: 3 }, { c: 3 }])

    expectError(function () {
      assert.includeDeepMembers([{ e: 5 }, { f: 6 }], [{ g: 7 }, { h: 8 }], 'blah')
    }, 'blah: expected [ { e: 5 }, { f: 6 } ] to be a superset of [ { g: 7 }, { h: 8 } ]')

    expectError(function () {
      assert.includeDeepMembers([{ e: 5 }, { f: 6 }], [{ e: 5 }, { f: 6 }, { z: 0 }])
    }, 'expected [ { e: 5 }, { f: 6 } ] to be a superset of [ { e: 5 }, { f: 6 }, { z: 0 } ]')
  })

  test('notIncludeDeepMembers', function () {
    const assert = new Assert()

    assert.notIncludeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ b: 2 }, { f: 5 }])

    expectError(function () {
      assert.notIncludeDeepMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ b: 2 }, { a: 1 }], 'blah')
    }, 'blah: expected [ { a: 1 }, { b: 2 }, { c: 3 } ] to not be a superset of [ { b: 2 }, { a: 1 } ]')
  })

  test('includeOrderedMembers', function () {
    const assert = new Assert()

    assert.includeOrderedMembers([1, 2, 3], [1, 2])

    expectError(function () {
      assert.includeOrderedMembers([1, 2, 3], [2, 1], 'blah')
    }, 'blah: expected [ 1, 2, 3 ] to be an ordered superset of [ 2, 1 ]')
  })

  test('notIncludeOrderedMembers', function () {
    const assert = new Assert()

    assert.notIncludeOrderedMembers([1, 2, 3], [2, 1])
    assert.notIncludeOrderedMembers([1, 2, 3], [2, 3])
    assert.notIncludeOrderedMembers([1, 2, 3], [1, 2, 2])

    expectError(function () {
      assert.notIncludeOrderedMembers([1, 2, 3], [1, 2], 'blah')
    }, 'blah: expected [ 1, 2, 3 ] to not be an ordered superset of [ 1, 2 ]')
  })

  test('includeDeepOrderedMembers', function () {
    const assert = new Assert()

    assert.includeDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { b: 2 }])

    expectError(function () {
      assert.includeDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ b: 2 }, { a: 1 }], 'blah')
    }, 'blah: expected [ { a: 1 }, { b: 2 }, { c: 3 } ] to be an ordered superset of [ { b: 2 }, { a: 1 } ]')
  })

  test('notIncludeDeepOrderedMembers', function () {
    const assert = new Assert()

    assert.notIncludeDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ b: 2 }, { a: 1 }])
    assert.notIncludeDeepOrderedMembers([{ a: 1 }, { b: 2 }, { c: 3 }], [{ a: 1 }, { f: 5 }])
    assert.notIncludeDeepOrderedMembers(
      [{ a: 1 }, { b: 2 }, { c: 3 }],
      [{ a: 1 }, { b: 2 }, { b: 2 }]
    )

    expectError(function () {
      assert.notIncludeDeepOrderedMembers(
        [{ a: 1 }, { b: 2 }, { c: 3 }],
        [{ a: 1 }, { b: 2 }],
        'blah'
      )
    }, 'blah: expected [ { a: 1 }, { b: 2 }, { c: 3 } ] to not be an ordered superset of [ { a: 1 }, { b: 2 } ]')
  })

  test('oneOf', function () {
    const assert = new Assert()

    assert.oneOf(1, [1, 2, 3])

    var three = [3]
    assert.oneOf(three, [1, 2, three])

    var four = { four: 4 }
    assert.oneOf(four, [1, 2, four])

    expectError(function () {
      assert.oneOf(1, 1 as any, 'blah')
    }, 'blah: expected 1 to be an array')

    expectError(function () {
      assert.oneOf(1, { a: 1 } as any)
    }, 'expected { a: 1 } to be an array')

    expectError(function () {
      assert.oneOf(9, [1, 2, 3], 'Message')
    }, 'Message: expected 9 to be one of [ 1, 2, 3 ]')

    expectError(function () {
      assert.oneOf([3], [1, 2, [3]])
    }, 'expected [ 3 ] to be one of [ 1, 2, [ 3 ] ]')

    expectError(function () {
      assert.oneOf({ four: 4 }, [1, 2, { four: 4 }])
    }, 'expected { four: 4 } to be one of [ 1, 2, { four: 4 } ]')
  })

  test('above', function () {
    const assert = new Assert()
    assert.isAbove(5, 2, '5 should be above 2')

    expectError(function () {
      assert.isAbove(1, 3, 'blah')
    }, 'blah: expected 1 to be above 3')

    expectError(function () {
      assert.isAbove(1, 1)
    }, 'expected 1 to be above 1')

    expectError(function () {
      assert.isAbove(null as any, 1, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isAbove(1, null as any, 'blah')
    }, 'blah: the argument to above must be a number')
  })

  test('above (dates)', function () {
    const assert = new Assert()

    const now = new Date()
    const oneSecondAgo = new Date(now.getTime() - 1000)
    assert.isAbove(now, oneSecondAgo, 'Now should be above 1 second ago')

    expectError(function () {
      assert.isAbove(oneSecondAgo, now, 'blah')
    }, 'blah: expected ' + oneSecondAgo.toUTCString() + ' to be above ' + now.toUTCString())

    expectError(function () {
      assert.isAbove(now, now, 'blah')
    }, 'blah: expected ' + now.toUTCString() + ' to be above ' + now.toUTCString())

    expectError(function () {
      assert.isAbove(null as any, now)
    }, 'expected null to be a number or a date')

    expectError(function () {
      assert.isAbove(now, null as any, 'blah')
    }, 'blah: the argument to above must be a date')

    expectError(function () {
      assert.isAbove(now, 1 as any, 'blah')
    }, 'blah: the argument to above must be a date')

    expectError(function () {
      assert.isAbove(1 as any, now, 'blah')
    }, 'blah: the argument to above must be a number')
  })

  test('above (luxon dates)', function () {
    const assert = new Assert()

    const now = DateTime.local()
    const oneSecondAgo = DateTime.local().minus({ seconds: 1000 })
    assert.isAbove(now, oneSecondAgo, 'Now should be above 1 second ago')

    expectError(function () {
      assert.isAbove(oneSecondAgo, now, 'blah')
    }, 'blah: expected ' +
      oneSecondAgo.toJSDate().toUTCString() +
      ' to be above ' +
      now.toJSDate().toUTCString())

    expectError(function () {
      assert.isAbove(now, now, 'blah')
    }, 'blah: expected ' +
      now.toJSDate().toUTCString() +
      ' to be above ' +
      now.toJSDate().toUTCString())

    expectError(function () {
      assert.isAbove(now, 1 as any, 'blah')
    }, 'blah: the argument to above must be a date')

    expectError(function () {
      assert.isAbove(1 as any, now, 'blah')
    }, 'blah: the argument to above must be a number')
  })

  test('atLeast', function () {
    const assert = new Assert()

    assert.isAtLeast(5, 2, '5 should be above 2')
    assert.isAtLeast(1, 1, '1 should be equal to 1')

    expectError(function () {
      assert.isAtLeast(1, 3, 'blah')
    }, 'blah: expected 1 to be at least 3')

    expectError(function () {
      assert.isAtLeast(null as any, 1, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isAtLeast(1, null as any, 'blah')
    }, 'blah: the argument to least must be a number')
  })

  test('atLeast (dates)', function () {
    const assert = new Assert()

    const now = new Date()
    const oneSecondAgo = new Date(now.getTime() - 1000)
    const oneSecondAfter = new Date(now.getTime() + 1000)

    assert.isAtLeast(now, oneSecondAgo, 'Now should be above one second ago')
    assert.isAtLeast(now, now, 'Now should be equal to now')

    expectError(function () {
      assert.isAtLeast(now, oneSecondAfter, 'blah')
    }, 'blah: expected ' + now.toUTCString() + ' to be at least ' + oneSecondAfter.toUTCString())

    expectError(function () {
      assert.isAtLeast(null as any, now, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isAtLeast(now, null as any, 'blah')
    }, 'blah: the argument to least must be a date')

    expectError(function () {
      assert.isAtLeast(1 as any, now, 'blah')
    }, 'blah: the argument to least must be a number')

    expectError(function () {
      assert.isAtLeast(now, 1 as any, 'blah')
    }, 'blah: the argument to least must be a date')
  })

  test('below', function () {
    const assert = new Assert()

    assert.isBelow(2, 5, '2 should be below 5')

    expectError(function () {
      assert.isBelow(3, 1, 'blah')
    }, 'blah: expected 3 to be below 1')

    expectError(function () {
      assert.isBelow(1, 1)
    }, 'expected 1 to be below 1')

    expectError(function () {
      assert.isBelow(null as any, 1, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isBelow(1, null as any, 'blah')
    }, 'blah: the argument to below must be a number')
  })

  test('below (dates)', function () {
    const assert = new Assert()

    var now = new Date()
    var oneSecondAgo = new Date(now.getTime() - 1000)
    assert.isBelow(oneSecondAgo, now, 'One second ago should be below now')

    expectError(function () {
      assert.isBelow(now, oneSecondAgo, 'blah')
    }, 'blah: expected ' + now.toUTCString() + ' to be below ' + oneSecondAgo.toUTCString())

    expectError(function () {
      assert.isBelow(now, now)
    }, 'expected ' + now.toUTCString() + ' to be below ' + now.toUTCString())

    expectError(function () {
      assert.isBelow(null as any, now, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isBelow(now, null as any, 'blah')
    }, 'blah: the argument to below must be a date')

    expectError(function () {
      assert.isBelow(now, 1 as any, 'blah')
    }, 'blah: the argument to below must be a date')

    expectError(function () {
      assert.isBelow(1 as any, now, 'blah')
    }, 'blah: the argument to below must be a number')
  })

  test('atMost', function () {
    const assert = new Assert()

    assert.isAtMost(2, 5, '2 should be below 5')
    assert.isAtMost(1, 1, '1 should be equal to 1')

    expectError(function () {
      assert.isAtMost(3, 1, 'blah')
    }, 'blah: expected 3 to be at most 1')

    expectError(function () {
      assert.isAtMost(null as any, 1, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isAtMost(1, null as any, 'blah')
    }, 'blah: the argument to most must be a number')
  })

  test('atMost (dates)', function () {
    const assert = new Assert()

    var now = new Date()
    var oneSecondAgo = new Date(now.getTime() - 1000)
    var oneSecondAfter = new Date(now.getTime() + 1000)

    assert.isAtMost(oneSecondAgo, now, 'Now should be below one second ago')
    assert.isAtMost(now, now, 'Now should be equal to now')

    expectError(function () {
      assert.isAtMost(oneSecondAfter, now, 'blah')
    }, 'blah: expected ' + oneSecondAfter.toUTCString() + ' to be at most ' + now.toUTCString())

    expectError(function () {
      assert.isAtMost(null as any, now, 'blah')
    }, 'blah: expected null to be a number or a date')

    expectError(function () {
      assert.isAtMost(now, null as any, 'blah')
    }, 'blah: the argument to most must be a date')

    expectError(function () {
      assert.isAtMost(now, 1 as any, 'blah')
    }, 'blah: the argument to most must be a date')

    expectError(function () {
      assert.isAtMost(1 as any, now, 'blah')
    }, 'blah: the argument to most must be a number')
  })

  test('isSealed / sealed', function () {
    const assert = new Assert()

    ;['isSealed', 'sealed'].forEach(function (isSealed) {
      var sealedObject = Object.seal({})

      assert[isSealed](sealedObject)

      expectError(function () {
        assert[isSealed]({}, 'blah')
      }, 'blah: expected {} to be sealed')

      // Making sure ES6-like Object.isSealed response is respected for all primitive types

      assert[isSealed](42)
      assert[isSealed](null)
      assert[isSealed]('foo')
      assert[isSealed](false)
      assert[isSealed](undefined)

      if (typeof Symbol === 'function') {
        assert[isSealed](Symbol())
      }

      if (typeof Proxy === 'function') {
        var proxy = new Proxy(
          {},
          {
            ownKeys: function () {
              throw new TypeError()
            },
          }
        )

        // Object.isSealed will call ownKeys trap only if object is not extensible
        Object.preventExtensions(proxy)

        expectError(
          function () {
            // isSealed should not suppress errors, thrown in proxy traps
            assert[isSealed](proxy)
          },
          { name: 'TypeError' }
        )
      }
    })
  })

  test('isNotSealed / notSealed', function () {
    const assert = new Assert()

    ;['isNotSealed', 'notSealed'].forEach(function (isNotSealed) {
      var sealedObject = Object.seal({})

      assert[isNotSealed]({})

      expectError(function () {
        assert[isNotSealed](sealedObject, 'blah')
      }, 'blah: expected {} to not be sealed')

      // Making sure ES6-like Object.isSealed response is respected for all primitive types

      expectError(function () {
        assert[isNotSealed](42)
      }, 'expected 42 to not be sealed')

      expectError(function () {
        assert[isNotSealed](null)
      }, 'expected null to not be sealed')

      expectError(function () {
        assert[isNotSealed]('foo')
      }, "expected 'foo' to not be sealed")

      expectError(function () {
        assert[isNotSealed](false)
      }, 'expected false to not be sealed')

      expectError(function () {
        assert[isNotSealed](undefined)
      }, 'expected undefined to not be sealed')

      if (typeof Proxy === 'function') {
        var proxy = new Proxy(
          {},
          {
            ownKeys: function () {
              throw new TypeError()
            },
          }
        )

        // Object.isSealed will call ownKeys trap only if object is not extensible
        Object.preventExtensions(proxy)

        expectError(
          function () {
            // isNotSealed should not suppress errors, thrown in proxy traps
            assert[isNotSealed](proxy)
          },
          { name: 'TypeError' }
        )
      }
    })
  })

  test('isFrozen / frozen', function () {
    const assert = new Assert()

    ;['isFrozen', 'frozen'].forEach(function (isFrozen) {
      var frozenObject = Object.freeze({})

      assert[isFrozen](frozenObject)

      expectError(function () {
        assert[isFrozen]({}, 'blah')
      }, 'blah: expected {} to be frozen')

      // Making sure ES6-like Object.isFrozen response is respected for all primitive types

      assert[isFrozen](42)
      assert[isFrozen](null)
      assert[isFrozen]('foo')
      assert[isFrozen](false)
      assert[isFrozen](undefined)

      if (typeof Symbol === 'function') {
        assert[isFrozen](Symbol())
      }

      if (typeof Proxy === 'function') {
        var proxy = new Proxy(
          {},
          {
            ownKeys: function () {
              throw new TypeError()
            },
          }
        )

        // Object.isFrozen will call ownKeys trap only if object is not extensible
        Object.preventExtensions(proxy)

        expectError(
          function () {
            // isFrozen should not suppress errors, thrown in proxy traps
            assert[isFrozen](proxy)
          },
          { name: 'TypeError' }
        )
      }
    })
  })

  test('isNotFrozen / notFrozen', function () {
    const assert = new Assert()

    ;['isNotFrozen', 'notFrozen'].forEach(function (isNotFrozen) {
      var frozenObject = Object.freeze({})

      assert[isNotFrozen]({})

      expectError(function () {
        assert[isNotFrozen](frozenObject, 'blah')
      }, 'blah: expected {} to not be frozen')

      // Making sure ES6-like Object.isFrozen response is respected for all primitive types

      expectError(function () {
        assert[isNotFrozen](42)
      }, 'expected 42 to not be frozen')

      expectError(function () {
        assert[isNotFrozen](null)
      }, 'expected null to not be frozen')

      expectError(function () {
        assert[isNotFrozen]('foo')
      }, "expected 'foo' to not be frozen")

      expectError(function () {
        assert[isNotFrozen](false)
      }, 'expected false to not be frozen')

      expectError(function () {
        assert[isNotFrozen](undefined)
      }, 'expected undefined to not be frozen')

      if (typeof Proxy === 'function') {
        var proxy = new Proxy(
          {},
          {
            ownKeys: function () {
              throw new TypeError()
            },
          }
        )

        // Object.isFrozen will call ownKeys trap only if object is not extensible
        Object.preventExtensions(proxy)

        expectError(
          function () {
            // isNotFrozen should not suppress errors, thrown in proxy traps
            assert[isNotFrozen](proxy)
          },
          { name: 'TypeError' }
        )
      }
    })
  })

  test('isEmpty / empty', function () {
    const assert = new Assert()

    ;['isEmpty', 'empty'].forEach(function (isEmpty) {
      function FakeArgs() {}
      FakeArgs.prototype.length = 0

      assert[isEmpty]('')
      assert[isEmpty]([])
      assert[isEmpty](new FakeArgs())
      assert[isEmpty]({})

      if (typeof WeakMap === 'function') {
        expectError(function () {
          assert[isEmpty](new WeakMap(), 'blah')
        }, 'blah: .empty was passed a weak collection')
      }

      if (typeof WeakSet === 'function') {
        expectError(function () {
          assert[isEmpty](new WeakSet(), 'blah')
        }, 'blah: .empty was passed a weak collection')
      }

      if (typeof Map === 'function') {
        assert[isEmpty](new Map())

        var map = new Map()
        ;(map as any).key = 'val'
        assert[isEmpty](map)
      }

      if (typeof Set === 'function') {
        assert[isEmpty](new Set())

        var set = new Set()
        ;(set as any).key = 'val'
        assert[isEmpty](set)
      }

      expectError(function () {
        assert[isEmpty]('foo', 'blah')
      }, "blah: expected 'foo' to be empty")

      expectError(function () {
        assert[isEmpty](['foo'])
      }, "expected [ 'foo' ] to be empty")

      expectError(function () {
        assert[isEmpty]({ arguments: 0 })
      }, 'expected { arguments: 0 } to be empty')

      expectError(function () {
        assert[isEmpty]({ foo: 'bar' })
      }, "expected { foo: 'bar' } to be empty")

      expectError(function () {
        assert[isEmpty](null, 'blah')
      }, 'blah: .empty was passed non-string primitive null')

      expectError(function () {
        assert[isEmpty](undefined)
      }, '.empty was passed non-string primitive undefined')

      expectError(function () {
        assert[isEmpty]()
      }, '.empty was passed non-string primitive undefined')

      expectError(function () {
        assert[isEmpty](0)
      }, '.empty was passed non-string primitive 0')

      expectError(function () {
        assert[isEmpty](1)
      }, '.empty was passed non-string primitive 1')

      expectError(function () {
        assert[isEmpty](true)
      }, '.empty was passed non-string primitive true')

      expectError(function () {
        assert[isEmpty](false)
      }, '.empty was passed non-string primitive false')

      if (typeof Symbol !== 'undefined') {
        expectError(function () {
          assert[isEmpty](Symbol())
        }, '.empty was passed non-string primitive Symbol()')

        expectError(function () {
          assert[isEmpty](Symbol.iterator)
        }, '.empty was passed non-string primitive Symbol(Symbol.iterator)')
      }

      expectError(function () {
        assert[isEmpty](function () {}, 'blah')
      }, 'blah: .empty was passed a function')

      if (FakeArgs.name === 'FakeArgs') {
        expectError(function () {
          assert[isEmpty](FakeArgs)
        }, '.empty was passed a function FakeArgs')
      }
    })
  })

  test('isNotEmpty / notEmpty', function () {
    const assert = new Assert()

    ;['isNotEmpty', 'notEmpty'].forEach(function (isNotEmpty) {
      function FakeArgs() {}
      FakeArgs.prototype.length = 0

      assert[isNotEmpty]('foo')
      assert[isNotEmpty](['foo'])
      assert[isNotEmpty]({ arguments: 0 })
      assert[isNotEmpty]({ foo: 'bar' })

      if (typeof WeakMap === 'function') {
        expectError(function () {
          assert[isNotEmpty](new WeakMap(), 'blah')
        }, 'blah: .empty was passed a weak collection')
      }

      if (typeof WeakSet === 'function') {
        expectError(function () {
          assert[isNotEmpty](new WeakSet(), 'blah')
        }, 'blah: .empty was passed a weak collection')
      }

      if (typeof Map === 'function') {
        // Not using Map constructor args because not supported in IE 11.
        var map = new Map()
        map.set('a', 1)
        assert[isNotEmpty](map)

        expectError(function () {
          assert[isNotEmpty](new Map())
        }, 'expected {} not to be empty')
      }

      if (typeof Set === 'function') {
        // Not using Set constructor args because not supported in IE 11.
        var set = new Set()
        set.add(1)
        assert[isNotEmpty](set)

        expectError(function () {
          assert[isNotEmpty](new Set())
        }, 'expected {} not to be empty')
      }

      expectError(function () {
        assert[isNotEmpty]('', 'blah')
      }, "blah: expected '' not to be empty")

      expectError(function () {
        assert[isNotEmpty]([])
      }, 'expected [] not to be empty')

      expectError(function () {
        assert[isNotEmpty](new FakeArgs())
      }, 'expected { length: 0 } not to be empty')

      expectError(function () {
        assert[isNotEmpty]({})
      }, 'expected {} not to be empty')

      expectError(function () {
        assert[isNotEmpty](null, 'blah')
      }, 'blah: .empty was passed non-string primitive null')

      expectError(function () {
        assert[isNotEmpty](undefined)
      }, '.empty was passed non-string primitive undefined')

      expectError(function () {
        assert[isNotEmpty]()
      }, '.empty was passed non-string primitive undefined')

      expectError(function () {
        assert[isNotEmpty](0)
      }, '.empty was passed non-string primitive 0')

      expectError(function () {
        assert[isNotEmpty](1)
      }, '.empty was passed non-string primitive 1')

      expectError(function () {
        assert[isNotEmpty](true)
      }, '.empty was passed non-string primitive true')

      expectError(function () {
        assert[isNotEmpty](false)
      }, '.empty was passed non-string primitive false')

      if (typeof Symbol !== 'undefined') {
        expectError(function () {
          assert[isNotEmpty](Symbol())
        }, '.empty was passed non-string primitive Symbol()')

        expectError(function () {
          assert[isNotEmpty](Symbol.iterator)
        }, '.empty was passed non-string primitive Symbol(Symbol.iterator)')
      }

      expectError(function () {
        assert[isNotEmpty](function () {}, 'blah')
      }, 'blah: .empty was passed a function')

      if (FakeArgs.name === 'FakeArgs') {
        expectError(function () {
          assert[isNotEmpty](FakeArgs)
        }, '.empty was passed a function FakeArgs')
      }
    })
  })
})

test.group('fail', function () {
  test('should accept a message as the 3rd argument', function () {
    const assert = new Assert()

    expectError(function () {
      assert.fail(0, 1, 'this has failed')
    }, /this has failed/)
  })

  test('should accept a message as the only argument', function () {
    const assert = new Assert()

    expectError(function () {
      assert.fail('this has failed')
    }, /this has failed/)
  })

  test('should produce a default message when called without any arguments', function () {
    const assert = new Assert()

    expectError(function () {
      assert.fail()
    }, /assert\.fail()/)
  })
})

test.group('assertion planning', function () {
  test('fail when planned assertions are over total assertions', function () {
    const assert = new Assert()
    assert.plan(2)

    expectError(function () {
      assert.fail(0, 1, 'this has failed')
    }, /this has failed/)

    expectError(function () {
      assert.assertions.validate()
    }, 'Planned for 2 assertions, but ran 1')
  })

  test('fail when planned assertions are under total assertions', function () {
    const assert = new Assert()
    assert.plan(0)

    expectError(function () {
      assert.fail(0, 1, 'this has failed')
    }, /this has failed/)

    expectError(function () {
      assert.assertions.validate()
    }, 'Planned for 0 assertions, but ran 1')
  })

  test('ignore when no assertions were planned', function () {
    const assert = new Assert()

    expectError(function () {
      assert.fail(0, 1, 'this has failed')
    }, /this has failed/)

    assert.assertions.validate()
  })
})
