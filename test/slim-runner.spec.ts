/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { assert } from 'chai'
import { test, run } from '../src/SlimRunner'
import { getTestReporter } from './helpers'

describe('SlimRunner', () => {
  it('create test using exported function', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter) })

    let executed = false
    test('hello', () => {
      executed = true
    })

    await run()
    assert.isTrue(executed)
    assert.deepEqual(reporter.events, [
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'root',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'pending',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'passed',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'root',
        },
      },
    ])
  })

  it('create test inside a group', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter) })

    let executed = false
    test.group('foo', () => {
      test('hello', () => {
        executed = true
      })
    })

    await run()
    assert.isTrue(executed)
    assert.deepEqual(reporter.events, [
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'foo',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'pending',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'passed',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'foo',
        },
      },
    ])
  })

  it('tests created outside of the group must be part of root group', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter) })

    test.group('foo', () => {
      test('hello', () => {
      })
    })

    test('hello', () => {
    })

    await run()
    assert.deepEqual(reporter.events, [
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'foo',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'pending',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'passed',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'foo',
        },
      },
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'root',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'pending',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[5].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'passed',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'root',
        },
      },
    ])
  })

  it('create skippable function', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter) })

    let executed = false
    test.skip('hello', () => {
      executed = true
    })

    await run()
    assert.isFalse(executed)

    assert.deepEqual(reporter.events, [
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'root',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'skipped',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'skipped',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'root',
        },
      },
    ])
  })

  it('create skippable function using runInCI', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter) })

    let executed = false
    test.runInCI('hello', () => {
      executed = true
    })

    await run()
    assert.isFalse(executed)

    assert.deepEqual(reporter.events, [
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'root',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'skipped',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'skipped',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'root',
        },
      },
    ])
  })

  it('create regression function using runInCI', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter) })

    test.failing('hello', () => {
      throw new Error('See it fails')
    })

    await run()

    assert.deepEqual(reporter.events, [
      {
        event: 'group:started',
        data: {
          error: null,
          status: 'pending',
          title: 'root',
        },
      },
      {
        event: 'test:started',
        data: {
          duration: 0,
          error: null,
          regression: true,
          regressionMessage: '',
          status: 'pending',
          title: 'hello',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: reporter.events[2].data.error,
          regression: true,
          regressionMessage: 'See it fails',
          status: 'passed',
          title: 'hello',
        },
      },
      {
        event: 'group:completed',
        data: {
          error: null,
          status: 'passed',
          title: 'root',
        },
      },
    ])
  })
})
