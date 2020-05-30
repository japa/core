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

    await run(false)
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

    await run(false)
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

    await run(false)
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

    await run(false)
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

    await run(false)

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

  it('stop tests after failing test when bail is true', async () => {
    const reporter = getTestReporter()
    test.configure({ reporterFn: reporter.fn.bind(reporter), bail: true })

    let executed = false
    const error = new Error('failed')

    test.group('foo', () => {
      test('hi', () => {
        throw error
      })

      test('hello', () => {
        executed = true
      })
    })

    await run(false)
    assert.isFalse(executed)
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
          title: 'hi',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[2].data.duration,
          error: error,
          regression: false,
          regressionMessage: '',
          status: 'failed',
          title: 'hi',
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

  it('only run tests matching the grep string', async () => {
    const reporter = getTestReporter()
    test.configure({
      reporterFn: reporter.fn.bind(reporter),
      bail: true,
      grep: 'hi',
    })

    let executed = false

    test.group('foo', () => {
      test('hi', () => {
      })

      test('hello', () => {
        executed = true
      })
    })

    await run(false)
    assert.isFalse(executed)
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
          title: 'hi',
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
          title: 'hi',
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

  it('only run tests matching the grep regex like string', async () => {
    const reporter = getTestReporter()
    test.configure({
      reporterFn: reporter.fn.bind(reporter),
      bail: true,
      grep: 'h(i|ey)',
    })

    let executed = false

    test.group('foo', () => {
      test('hi', () => {
      })

      test('hey', () => {
      })

      test('hello', () => {
        executed = true
      })
    })

    await run(false)
    assert.isFalse(executed)
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
          title: 'hi',
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
          title: 'hi',
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
          title: 'hey',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[4].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'passed',
          title: 'hey',
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

  it('only run tests matching the grep regex', async () => {
    const reporter = getTestReporter()
    test.configure({
      reporterFn: reporter.fn.bind(reporter),
      bail: true,
      grep: /h(i|ey)/,
    })

    let executed = false

    test.group('foo', () => {
      test('hi', () => {
      })

      test('hey', () => {
      })

      test('hello', () => {
        executed = true
      })
    })

    await run(false)
    assert.isFalse(executed)
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
          title: 'hi',
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
          title: 'hi',
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
          title: 'hey',
        },
      },
      {
        event: 'test:completed',
        data: {
          duration: reporter.events[4].data.duration,
          error: null,
          regression: false,
          regressionMessage: '',
          status: 'passed',
          title: 'hey',
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

  it('cherry pick test using the .only method', async () => {
    const reporter = getTestReporter()
    test.configure({
      reporterFn: reporter.fn.bind(reporter),
      bail: true,
      grep: undefined,
    })

    let executed = false

    test.group('foo', () => {
      test('hi', () => {
      })

      test('hey', () => {
      })

      test.only('hello', () => {
        executed = true
      })
    })

    await run(false)
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
})
