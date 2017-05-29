'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const util = exports = module.exports = {}

/**
 * The `s` verb to be used by checking the
 * count. The simplest way to append `s`
 * to statement to make it plural only
 * when count is not = 1.
 *
 * @method verb
 *
 * @param  {Number} count
 *
 * @return {String}
 */
util.verb = function (count) {
  return count === 1 ? '' : 's'
}

util.eventsList = Object.freeze({
  GROUP_START: 'group:start',
  GROUP_END: 'group:end',
  TEST_START: 'test:start',
  TEST_END: 'test:end',
  GROUP_HOOK_START: {
    before: 'hook:before:start',
    beforeEach: 'hook:beforeEach:start',
    after: 'hook:after:start',
    afterEach: 'hook:afterEach:start'
  },
  GROUP_HOOK_END: {
    before: 'hook:before:end',
    beforeEach: 'hook:beforeEach:end',
    after: 'hook:after:end',
    afterEach: 'hook:afterEach:end'
  }
})
