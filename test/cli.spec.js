'use strict'

const test = require('tape')
const cli = require('../cli')

test('allow a string to be ignored', (assert) => {
  assert.plan(1)
  cli.filter('foo.js')
  assert.deepEqual(cli.ignorePattern, ['foo.js'])
  cli._initiate()
})

test('allow an array of globs to be ignored', (assert) => {
  assert.plan(1)
  cli.filter(['foo.js', 'bar.js'])
  assert.deepEqual(cli.ignorePattern, ['foo.js', 'bar.js'])
  cli._initiate()
})

test('allow a callback to be passed to filter fn', (assert) => {
  assert.plan(2)
  cli.filter(function () {})
  assert.equal(typeof (cli.filterCallback), 'function')
  assert.equal(cli.ignorePattern.length, 0)
  cli._initiate()
})

test('throw exception when filter param is not an array,string of fn', (assert) => {
  assert.plan(1)
  try {
    cli.filter({})
  } catch (error) {
    assert.equal(error.message, 'cli.filter only excepts a glob string, array or a callback function')
    cli._initiate()
  }
})

test('set glob pattern for test files', (assert) => {
  assert.plan(2)
  assert.equal(cli.testsGlob, 'test/*.spec.js')
  cli.run('test/**/*.js')
  assert.equal(cli.testsGlob, 'test/**/*.js')
  cli._initiate()
})

test('throw exception when pattern is not a string', (assert) => {
  assert.plan(1)
  try {
    cli.run(['test/**/*.js'])
  } catch (error) {
    assert.equal(error.message, 'cli.run excepts glob pattern to be a string. You passed object')
    cli._initiate()
  }
})
