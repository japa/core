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

import chalk from 'chalk'
import * as ms from 'ms'
// import * as variableDiff from 'variable-diff'
// import * as rightPad from 'right-pad'
import * as timeSpan from 'time-span'

import { IEvents, IGroupReport, ITestReport, ITestRecord, ITestStatus } from '../Contracts'

const icons = {
  passed: chalk.green('✓'),
  failed: chalk.red('✖'),
  skipped: chalk.yellow('.'),
  todo: chalk.cyan('!'),
  regression: '',
}

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
  private activeGroup: string | null = null
  private startTick: Function
  private store: ITestRecord = {
    regressionCount: 0,
    passedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    total: 0,
    todoCount: 0,
    tests: [],
  }

  constructor (emitter) {
    emitter.on(IEvents.STARTED, this.onStart.bind(this))
    emitter.on(IEvents.COMPLETED, this.onEnd.bind(this))
    emitter.on(IEvents.GROUPSTARTED, this.onGroupStart.bind(this))
    emitter.on(IEvents.GROUPCOMPLETED, this.onGroupEnd.bind(this))
    emitter.on(IEvents.TESTCOMPLETED, this.onTestEnd.bind(this))
  }

  public onStart () {
    this.startTick = timeSpan()
  }

  public onEnd () {
    const duration = this.startTick()
    console.log(JSON.stringify(this.store, null, 2))
    console.log(duration)
  }

  public onGroupStart (info: IGroupReport) {
    this.activeGroup = info.title
    console.log(chalk.dim(info.title))
  }

  public onGroupEnd () {
    this.activeGroup = null
  }

  public onTestEnd (info: ITestReport) {
    this.store.total++

    switch (info.status) {
      case ITestStatus.PASSED:
        this.store.passedCount++
        break
      case ITestStatus.FAILED:
        this.store.failedCount++
        break
      case ITestStatus.SKIPPED:
        this.store.skippedCount++
        break
      case ITestStatus.TODO:
        this.store.todoCount++
        break
    }

    if (info.regression) {
      this.store.regressionCount++
    }

    if (info.status === ITestStatus.FAILED) {
      this.store.tests.push({
        group: this.activeGroup || '',
        title: info.title,
        error: info.error!,
      })
    }

    const indent = this.activeGroup ? '  ' : ''
    const titleColor = info.regression ? 'magenta' : colors[info.status]
    const duration = `(${ms(info.duration)})`

    console.log(`${indent} ${icons[info.status]} ${chalk[titleColor](info.title)} ${chalk.dim(duration)}`)
  }

}

export default function listReporter (emitter) {
  return new ListReporter(emitter)
}
