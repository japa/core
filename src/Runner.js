'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const pMapSeries = require('p-map-series')
const Test = require('./Test')
const Group = require('./Group')
const emitter = require('../lib/emitter')
const $ = require('../lib/util')

let testGroups = []

/**
 * Pushes a new default group to the tests groups. It is
 * important to create a new default group after each
 * test explicit group to keep tests in right order.
 *
 * @private
 */
const _pushDefaultGroup = function () {
  testGroups.push(new Group('default', false, true))
}

// START WITH A DEFAULT GROUP
_pushDefaultGroup()

/**
 * Adds a new test to the latest group
 *
 * @param   {String}   title
 * @param   {Function} callback
 * @param   {Boolean}   skip
 * @private
 */
const _addTest = function (title, callback, skip) {
  const test = new Test(title, callback, skip)
  const lastGroup = testGroups[testGroups.length - 1]
  lastGroup.addTest(test)
  return test
}

const Runner = exports = module.exports = {}

/**
 * Returns the list of groups
 *
 * @return {Array}
 */
Runner.getGroups = function () {
  return testGroups
}

/**
 * Clears the groups and tests stack
 */
Runner.clear = function () {
  testGroups = []
  _pushDefaultGroup()
}

/**
 * Adds a new test to the relevant test group
 * @param  {String}   title
 * @param  {Function} callback
 * @return {Object}
 */
Runner.test = function (title, callback) {
  return _addTest(title, callback, false)
}

/**
 * Add a skipable test.
 *
 * @param  {String}   title
 * @param  {Function} callback
 * @return {Object}
 */
Runner.test.skip = function (title, callback) {
  return _addTest(title, callback, true)
}

/**
 * Add a new group to have nested tests.
 * @param  {String}   title
 * @param  {Function} callback
 * @return {Object}
 */
Runner.group = function (title, callback) {
  const group = new Group(title)
  testGroups.push(group)
  callback(group)

  // Push default group after each test
  _pushDefaultGroup()
}

/**
 * Run all tests in a sequence.
 * @return {Promise}
 */
Runner.run = function () {
  return pMapSeries(testGroups, (group) => group.run())
}

/**
 * Sets global timeout to be used for all tests.
 *
 * @param  {Number} time
 */
Runner.timeout = function (time) {
  $.setTimeout(time)
}

// EMITTER EVENTS
Runner.on = emitter.on.bind(emitter)
Runner.once = emitter.once.bind(emitter)
Runner.removeListener = emitter.removeListener.bind(emitter)
Runner.removeAllListeners = emitter.removeAllListeners.bind(emitter)
Runner.eventNames = emitter.eventNames.bind(emitter)
