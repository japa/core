/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Assert } from '../../src/Assert'
import { expectError } from '../../test-helpers'

/**
 * Tests are copied from https://raw.githubusercontent.com/debitoor/chai-subset/master/test/unit/chai-subset.spec.js.
 *
 * Therefore the tests naming and styles are not same as I would
 * normally have
 */
test.group('plain object', function () {
  const testedObject = {
    a: 'b',
    c: 'd',
  }

  test('should pass for smaller object', function () {
    const assert = new Assert()
    assert.containsSubset(testedObject, {
      a: 'b',
    })
  })

  test('should pass for same object', function () {
    const assert = new Assert()
    assert.containsSubset(testedObject, {
      a: 'b',
      c: 'd',
    })
  })

  test('prefix substring', function () {
    const assert = new Assert()
    expectError(function () {
      assert.containsSubset(
        {
          a: 1,
        },
        {
          a: 2,
        },
        'foo'
      )
    }, 'foo: expected { a: 2 } to contain subset { a: 1 }')
  })

  test('should pass for similar, but not the same object', function () {
    const assert = new Assert()
    assert.notContainsSubset(testedObject, {
      a: 'notB',
      c: 'd',
    })
  })
})

test.group('complex object', function () {
  const testedObject = {
    a: 'b',
    c: 'd',
    e: {
      foo: 'bar',
      baz: {
        qux: 'quux',
      },
    },
  }

  test('should pass for smaller object', function () {
    const assert = new Assert()
    assert.containsSubset(testedObject, {
      a: 'b',
      e: {
        foo: 'bar',
      },
    })
  })

  test('should pass for smaller object', function () {
    const assert = new Assert()
    assert.containsSubset(testedObject, {
      e: {
        foo: 'bar',
        baz: {
          qux: 'quux',
        },
      },
    })
  })

  test('should pass for same object', function () {
    const assert = new Assert()
    assert.containsSubset(testedObject, {
      a: 'b',
      c: 'd',
      e: {
        foo: 'bar',
        baz: {
          qux: 'quux',
        },
      },
    })
  })

  test('should pass for similar, but not the same object', function () {
    const assert = new Assert()
    assert.notContainsSubset(testedObject, {
      e: {
        foo: 'bar',
        baz: {
          qux: 'notAQuux',
        },
      },
    })
  })

  test('should fail if comparing when comparing objects to dates', function () {
    const assert = new Assert()
    assert.notContainsSubset(testedObject, {
      e: new Date(),
    })
  })
})

test.group('circular objects', function (group) {
  const object: any = {}

  group.before(function () {
    object.arr = [object, object]
    object.arr.push(object.arr)
    object.obj = object
  })

  test('should contain subdocument', function () {
    const assert = new Assert()
    assert.containsSubset(object, {
      arr: [{ arr: [] }, { arr: [] }, [{ arr: [] }, { arr: [] }]],
    })
  })

  test('should not contain similar object', function () {
    const assert = new Assert()
    assert.notContainsSubset(object, {
      arr: [{ arr: ['just random field'] }, { arr: [] }, [{ arr: [] }, { arr: [] }]],
    })
  })
})

test.group('object with compare function', function () {
  test('should pass when function returns true', function () {
    const assert = new Assert()
    assert.containsSubset({ a: 5 }, { a: (a) => a })
  })

  test('should fail when function returns false', function () {
    const assert = new Assert()
    assert.notContainsSubset({ a: 5 }, { a: (a) => !a })
  })

  test('should pass for function with no arguments', function () {
    const assert = new Assert()
    assert.containsSubset({ a: 5 }, { a: () => true })
  })
})

test.group('comparison of non objects', function () {
  test('should fail if actual subset is null', function () {
    const assert = new Assert()
    assert.notContainsSubset(null, { a: 1 })
  })

  test('should fail if expected subset is not a object', function () {
    const assert = new Assert()
    assert.notContainsSubset({ a: 1 }, null)
  })

  test('should not fail for same non-object (string) variables', function () {
    const assert = new Assert()
    assert.containsSubset('string', 'string')
  })
})

test.group('comparison of dates', function () {
  test('should pass for the same date', function () {
    const assert = new Assert()
    assert.containsSubset(new Date('2015-11-30'), new Date('2015-11-30'))
  })

  test('should pass for the same date if nested', function () {
    const assert = new Assert()
    assert.containsSubset({ a: new Date('2015-11-30') }, { a: new Date('2015-11-30') })
  })

  test('should fail for a different date', function () {
    const assert = new Assert()
    assert.notContainsSubset(new Date('2015-11-30'), new Date('2012-02-22'))
  })

  test('should fail for a different date if nested', function () {
    const assert = new Assert()
    assert.notContainsSubset({ a: new Date('2015-11-30') }, { a: new Date('2012-02-22') })
  })

  test('should fail for invalid expected date', function () {
    const assert = new Assert()
    assert.notContainsSubset(new Date('2015-11-30'), new Date('not valid date'))
  })

  test('should fail for invalid actual date', function () {
    const assert = new Assert()
    assert.notContainsSubset(new Date('not valid actual date'), new Date('not valid expected date'))
  })
})

test.group('cyclic objects', () => {
  test('should pass', () => {
    const assert = new Assert()
    const child: any = {}
    const parent = {
      children: [child],
    }
    child.parent = parent

    const myObject = {
      a: 1,
      b: 'two',
      c: parent,
    }
    assert.containsSubset(myObject, {
      a: 1,
      c: parent,
    })
  })
})
