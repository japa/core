/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert as chaiAssert } from 'chai'
import { Assert } from '../src/Assert'

describe('Assert', () => {
  it('run assertions using chai.assert api', () => {
    const assert = new Assert() as any
    assert.equal(2 + 2, 4)
    assert.evaluate()
    chaiAssert.equal(assert['_counts'], 1)
  })

  it('complain when planned for assertions but count doesn\'t match', () => {
    const assert = new Assert() as any
    assert.plan(2)
    assert.equal(2 + 2, 4)

    try {
      assert.evaluate()
      chaiAssert.isTrue(false)
    } catch (error) {
      chaiAssert.equal(error.message, 'Planned for 2 assertions, but ran 1')
    }
  })

  it('use chai plugins', () => {
    Assert.use(function cb (chai) {
      chai.assert.isVirk = function isVirk (name) {
        chai.assert.equal(name, 'virk')
      }
    })

    const assert = new Assert() as any
    assert.isVirk('virk')
    assert.evaluate()
  })
})
