/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert } from 'chai'
import { TestsStore } from '../src/utils'
import { ITestStatus, IGroupStatus } from '../src/Contracts'

describe('Tests store', () => {
  it('must increase the total counter when reportTest is called', () => {
    const store = new TestsStore()
    store.recordTest({
      title: 'hello',
      duration: 0,
      status: ITestStatus.PASSED,
      regression: false,
      regressionMessage: '',
      error: null,
    })

    assert.equal(store.getReport().total, 1)
    assert.equal(store.getReport().passedCount, 1)
  })

  it('store failed tests', () => {
    const store = new TestsStore()
    const error = new Error('failed')

    store.recordGroup({ title: 'sample', status: IGroupStatus.PASSED, error: null })
    store.recordTest({
      title: 'hello',
      duration: 0,
      status: ITestStatus.FAILED,
      regression: false,
      regressionMessage: '',
      error: error,
    })

    assert.equal(store.getReport().total, 1)
    assert.equal(store.getReport().failedCount, 1)
    assert.lengthOf(store.getReport().groups, 1)
    assert.deepEqual(store.getReport().groups, [{
      title: 'sample',
      failedTests: [{
        title: 'hello',
        error: error,
      }],
      failedHooks: [],
    }])
  })

  it('increase passed and regression count together', () => {
    const store = new TestsStore()

    store.recordGroup({ title: 'sample', status: IGroupStatus.PASSED, error: null })
    store.recordTest({
      title: 'hello',
      duration: 0,
      status: ITestStatus.PASSED,
      regression: true,
      regressionMessage: '',
      error: null,
    })

    assert.equal(store.getReport().total, 1)
    assert.equal(store.getReport().passedCount, 1)
    assert.equal(store.getReport().regressionCount, 1)
  })

  it('increase skipped count', () => {
    const store = new TestsStore()

    store.recordGroup({ title: 'sample', status: IGroupStatus.PASSED, error: null })
    store.recordTest({
      title: 'hello',
      duration: 0,
      status: ITestStatus.SKIPPED,
      regression: true,
      regressionMessage: '',
      error: null,
    })

    assert.equal(store.getReport().total, 1)
    assert.equal(store.getReport().passedCount, 0)
    assert.equal(store.getReport().skippedCount, 1)
  })

  it('increase todo count', () => {
    const store = new TestsStore()

    store.recordGroup({ title: 'sample', status: IGroupStatus.PASSED, error: null })
    store.recordTest({
      title: 'hello',
      duration: 0,
      status: ITestStatus.TODO,
      regression: true,
      regressionMessage: '',
      error: null,
    })

    assert.equal(store.getReport().total, 1)
    assert.equal(store.getReport().todoCount, 1)
  })
})
