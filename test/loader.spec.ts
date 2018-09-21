/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { join } from 'path'
import { assert } from 'chai'
import { Loader } from '../src/SlimRunner/Loader'

describe('Loader', () => {
  it('load files using the glob pattern', async () => {
    const loader = new Loader()
    loader.files(['test/*.spec.ts'])

    const files = await loader.loadFiles()

    assert.deepEqual(files, [
      'test/assert.spec.ts',
      'test/callable.spec.ts',
      'test/group.spec.ts',
      'test/loader.spec.ts',
      'test/runner.spec.ts',
      'test/slim-runner.spec.ts',
      'test/test.spec.ts',
      'test/tests-store.spec.ts',
    ].map((file) => join(__dirname, '..', file)))
  })

  it('allow negate globs', async () => {
    const loader = new Loader()
    loader.files(['test/*.spec.ts', '!test/group.spec.ts'])

    const files = await loader.loadFiles()

    assert.deepEqual(files, [
      'test/assert.spec.ts',
      'test/callable.spec.ts',
      'test/loader.spec.ts',
      'test/runner.spec.ts',
      'test/slim-runner.spec.ts',
      'test/test.spec.ts',
      'test/tests-store.spec.ts',
    ].map((file) => join(__dirname, '..', file)))
  })

  it('filter files using filterFn', async () => {
    const loader = new Loader()
    loader.files(['test/*.spec.ts'])
    loader.filter((file) => !file.endsWith('test/group.spec.ts'))

    const files = await loader.loadFiles()

    assert.deepEqual(files, [
      'test/assert.spec.ts',
      'test/callable.spec.ts',
      'test/loader.spec.ts',
      'test/runner.spec.ts',
      'test/slim-runner.spec.ts',
      'test/test.spec.ts',
      'test/tests-store.spec.ts',
    ].map((file) => join(__dirname, '..', file)))
  })
})
