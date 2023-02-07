/*
 * @japa/core
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Emitter } from '../../src/emitter'

test.group('emitter', () => {
  test('define an error handler to handle listener errors', async (assert, done) => {
    const emitter = new Emitter()
    emitter.on('test:end', async () => {
      throw new Error('Unable to handle')
    })

    emitter.onError((error) => {
      assert.equal(error.message, 'Unable to handle')
      done()
    })

    await emitter.emit('test:end')
  })

  test('raise exception when no error handler is defined', async (assert, done) => {
    const emitter = new Emitter()
    emitter.on('test:end', async () => {
      throw new Error('Unable to handle')
    })

    try {
      await emitter.emit('test:end')
    } catch (error) {
      assert.equal(error.message, 'Unable to handle')
      done()
    }
  })
})
