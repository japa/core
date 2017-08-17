'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const assert = chai.assert
chai.config.showDiff = true

const util = require('../lib/util')

class Assertion {
  constructor () {
    /**
     * number of planned tests
     * @type {Number}
     */
    this._planned = 0

    /**
     * number of tests ran
     * @type {Number}
     */
    this._ran = 0

    /**
     * Proxy methods on the assertion library to
     * count the assertions made by the user.
     */
    return new Proxy(this, {
      get: function (target, name) {
        if (typeof (target[name]) !== 'undefined') {
          return target[name]
        }

        if (assert[name]) {
          target._ran++
        }

        return assert[name]
      }
    })
  }

  /**
   * Define the number of planned assertions
   *
   * @method plan
   *
   * @param {Function} num
   */
  plan (num) {
    if (typeof (num) !== 'number') {
      throw new Error('Planned assertions should be valid number')
    }
    this._planned = num
  }

  /**
   * Evaluates the assertions being made and throws
   * an exception if planned assertions mis-matches
   * the ran assertions
   *
   * @method evaluate
   *
   * @throws {Error} If planned assertions mis-match the ran assertions
   */
  evaluate () {
    if (this._planned <= 0 || this._planned === this._ran) {
      return
    }

    assert.fail(
      this._ran,
      this._planned,
      `planned for ${this._planned} assertion${util.verb(this._planned)} but ran ${this._ran}`
    )
  }

  /**
   * Apply plugin on the chai instance
   *
   * @method use
   *
   * @param  {Function} chaiPlugin
   *
   * @chainable
   */
  static use (chaiPlugin) {
    chai.use(chaiPlugin)
    return this
  }
}

module.exports = Assertion
