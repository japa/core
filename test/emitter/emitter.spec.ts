/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'node:test'
import { assert } from 'chai'
import { Emitter } from '../../src/emitter.js'

test.describe('emitter', () => {
  test('define an error handler to handle listener errors', (_, done) => {
    const emitter = new Emitter()
    emitter.on('test:end', async () => {
      throw new Error('Unable to handle')
    })

    emitter.onError((error) => {
      assert.equal(error.message, 'Unable to handle')
      done()
    })

    emitter.emit('test:end')
  })

  test('raise exception when no error handler is defined', (_, done) => {
    const emitter = new Emitter()
    emitter.on('test:end', async () => {
      throw new Error('Unable to handle')
    })

    emitter.emit('test:end').catch((error) => {
      assert.equal(error.message, 'Unable to handle')
      done()
    })
  })
})
