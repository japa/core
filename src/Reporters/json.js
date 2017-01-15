'use strict'

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

module.exports = function (emitter) {
  const testsCounts = {
    passed: 0,
    skipped: 0,
    total: 0,
    failed: 0,
    todo: 0
  }

  emitter.on('test:end', (stats) => {
    testsCounts[stats.status]++
    testsCounts.total++
    stats.event = 'test:end'
    console.log(JSON.stringify(stats))
  })

  emitter.on('end', ({status}) => {
    testsCounts.status = status
    console.log(JSON.stringify(testsCounts))
  })

  emitter.on('group:start', (stats) => {
    stats.event = 'group:start'
    console.log(JSON.stringify(stats))
  })

  emitter.on('group:end', (stats) => {
    stats.type = 'group:end'
    console.log(JSON.stringify(stats))
  })
}
