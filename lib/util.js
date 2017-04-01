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

let DEFAULT_TIMEOUT = 2000
let BAIL_TESTS = false

util.verb = function (count) {
  return count === 1 ? '' : 's'
}

util.setTimeout = function (timeout) {
  DEFAULT_TIMEOUT = timeout
}

util.getTimeout = function () {
  return DEFAULT_TIMEOUT
}

util.setBail = function (state) {
  BAIL_TESTS = !!state
}

util.getBail = function () {
  return BAIL_TESTS
}

util.getEventsList = function () {
  return {
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
  }
}
