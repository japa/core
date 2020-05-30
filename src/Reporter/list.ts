/**
 * @module Core
 */

/*
 * japa
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import ms from 'ms'
import chalk from 'chalk'
import rightPad from 'right-pad'
import variableDiff from 'variable-diff'

import { TestsStore, isCoreException } from '../utils'
import { IEvents, IGroupReport, ITestReport } from '../Contracts'

/**
 * Icons to be used for different test and group
 * statuses
 */
const icons = {
  passed: chalk.green('✓'),
  failed: chalk.red('✖'),
  skipped: chalk.yellow('.'),
  todo: chalk.cyan('!'),
  regression: '',
}

/**
 * Colors to be used for different test and group
 * statuses
 */
const colors = {
  passed: 'grey',
  failed: 'red',
  skipped: 'yellow',
  todo: 'cyan',
  regression: 'magenta',
}

/**
 * List reporter to show the tests progress on stdout in
 * a list format
 */
class ListReporter {
  private _store: TestsStore = new TestsStore()

  constructor (emitter) {
    emitter.on(IEvents.STARTED, this._onStart.bind(this))
    emitter.on(IEvents.COMPLETED, this._onEnd.bind(this))
    emitter.on(IEvents.GROUPSTARTED, this._onGroupStart.bind(this))
    emitter.on(IEvents.GROUPCOMPLETED, this._onGroupEnd.bind(this))
    emitter.on(IEvents.TESTCOMPLETED, this._onTestEnd.bind(this))
  }

  private get _indent () {
    return this._store.activeGroup.title === 'root' ? '' : '  '
  }

  /**
   * When test runner has started. We just need to initiate
   * the store on this event
   */
  private _onStart () {
    console.log('')
    this._store.open()
  }

  /**
   * Everytime a new group starts
   */
  private _onGroupStart (group: IGroupReport) {
    this._store.recordGroup(group)

    /**
     * Log group title when it's not root
     */
    if (group.title !== 'root') {
      console.log(`\n${group.title}`)
    }
  }

  /**
   * Everytime a group has completed running all tests
   */
  private _onGroupEnd (group: IGroupReport) {
    this._store.endGroup(group)
  }

  /**
   * Print count for a label
   */
  private _printCount (label, count) {
    if (count) {
      console.log(chalk.dim(`${rightPad(label, 13)} : ${count}`))
    }
  }

  /**
   * Prints the error for the test. If error is an assertion error, then
   * there is no need to print the stack.
   */
  private _printTestError (error: any) {
    if (isCoreException(error)) {
      console.log(chalk.red(`    ${error.message}`))
      return
    }

    const { actual, expected } = error
    if (actual && expected) {
      console.log(chalk.red(`    Assertion Error: ${error.message}`))
      variableDiff(actual, expected).text.split('\n').forEach((line) => {
        console.log(`    ${line}`)
      })
      return
    }

    console.log(`    ${this._getStack(error.stack)}`)
  }

  /**
   * Everytime tests ends
   */
  private _onTestEnd (test: ITestReport) {
    this._store.recordTest(test)

    const icon = icons[test.status]
    const message = chalk[colors[test.status]](test.title)
    const duration = chalk.dim(`(${ms(test.duration)})`)

    const regressionMessage = test.regressionMessage
      ? `\n${this._indent}  ${chalk.magenta(test.regressionMessage)}`
      : ''

    console.log(`${this._indent}${icon} ${message} ${duration}${regressionMessage}`)
  }

  /**
   * Returns a boolean if the error stack fine part of the
   * japa core
   */
  private _isNativeStackLine (line) {
    return ['Callable'].some((keyword) => line.includes(keyword))
  }

  /**
   * Returns a boolean telling if error stack is part
   * of japa core by finding the sorroundings.
   */
  private _isNativeSorroundedLine (line) {
    return ['Generator.next', 'new Promise'].some((keyword) => line.includes(keyword))
  }

  /**
   * Returns the title for the failing test
   */
  private _getFailingTitle (title) {
    return chalk.red(`${icons.failed} ${title}`)
  }

  /**
   * Returns the error stack by filtering the japa core
   * lines from it.
   */
  private _getStack (errorStack) {
    let prevIsNative = false

    return errorStack
      .split('\n')
      .filter((line) => {
        if (prevIsNative && this._isNativeSorroundedLine(line)) {
          return false
        }
        prevIsNative = this._isNativeStackLine(line)
        return !prevIsNative
      })
      .map((line, index) => {
        if (index === 0) {
          return chalk.red(line)
        }
        return chalk.dim(line)
      })
      .join('\n')
  }

  /**
   * When test runner stops
   */
  private _onEnd () {
    this._store.close()
    const report = this._store.getReport()

    /**
     * Show zero executed tests when no tests were ran
     */
    if (report.total === 0 && report.groups.length === 0) {
      console.log(chalk.bgMagenta.white(' ZERO TESTS EXECUTED '))
      return
    }

    const failedGroups = report.groups.filter((group) => {
      return group.failedTests.length || group.failedHooks.length
    })

    console.log('')
    if (failedGroups.length) {
      console.log(chalk.bgRed.white(' FAILED '))
    } else {
      console.log(chalk.bgGreen.white(' PASSED '))
    }
    console.log('')

    this._printCount('total', report.total)
    this._printCount('failed', report.failedCount)
    this._printCount('passed', report.passedCount)
    this._printCount('todo', report.todoCount)
    this._printCount('skipped', report.skippedCount)
    this._printCount('regression', report.regressionCount)
    this._printCount('duration', ms(report.duration))

    failedGroups.forEach(({ title, failedHooks, failedTests }) => {
      console.log('')
      console.log(failedHooks.length ? this._getFailingTitle(title) : title)

      if (failedHooks.length) {
        const failedHook = failedHooks[0]
        console.log(`${chalk.red(`  (${failedHook.title})`)} ${this._getStack(failedHook.error.stack)}`)
      }

      if (failedTests.length) {
        failedTests.forEach((test) => {
          console.log('')
          console.log(`  ${this._getFailingTitle(test.title)}`)
          this._printTestError(test.error)
        })
      }
    })
  }
}

export default function listReporter (emitter) {
  return new ListReporter(emitter)
}
