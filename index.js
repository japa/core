'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const runner = new (require('./src/Runner'))()
const emitter = require('./lib/emitter')

const nextTick = typeof (setImmediate) !== 'undefined' ? setImmediate : process.nextTick

nextTick(function () {
  runner
  .run()
  .then(() => {
    process.exit(0)
  })
  .catch(() => {
    process.exit(1)
  })
})

exports = module.exports = runner.test.bind(runner)
exports.skip = runner.skip.bind(runner)
exports.group = runner.group.bind(runner)
exports.run = runner.run.bind(runner)
exports.timeout = runner.timeout.bind(runner)
exports.use = runner.use.bind(runner)

// EMITTER EVENTS
exports.on = emitter.on.bind(emitter)
exports.once = emitter.once.bind(emitter)
exports.removeListener = emitter.removeListener.bind(emitter)
exports.removeAllListeners = emitter.removeAllListeners.bind(emitter)
exports.eventNames = emitter.eventNames.bind(emitter)
