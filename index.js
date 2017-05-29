'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const slimRunner = new (require('./src/SlimRunner'))(require('./lib/props'))

const nextTick = typeof (setImmediate) !== 'undefined' ? setImmediate : process.nextTick

nextTick(function () {
  slimRunner
  .run()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
})

exports = module.exports = slimRunner.test.bind(slimRunner)
exports.skip = slimRunner.skip.bind(slimRunner)
exports.failing = slimRunner.failing.bind(slimRunner)
exports.group = slimRunner.group.bind(slimRunner)
exports.timeout = slimRunner.timeout.bind(slimRunner)
exports.use = slimRunner.use.bind(slimRunner)
exports.bail = slimRunner.bail.bind(slimRunner)
exports.grep = slimRunner.grep.bind(slimRunner)
