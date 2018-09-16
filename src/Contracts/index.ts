/**
 * @module Core
 */

export enum IEvents {
  TESTSTARTED = 'test:started',
  TESTCOMPLETED = 'test:completed',
  GROUPSTARTED = 'group:started',
  GROUPCOMPLETED = 'group:completed',
  STARTED = 'started',
  COMPLETED = 'completed',
}

export type IOptions = {
  bail: boolean,
  timeout: number,
  grep: string | null,
}

export type ITestOptions = {
  timeout: number,
  regression: boolean,
  skip?: boolean,
  skipInCI?: boolean,
  runInCI?: boolean,
}

export enum IGroupStatus {
  FAILED = 'failed',
  PASSED = 'passed',
  PENDING = 'pending',
}

export enum ITestStatus {
  FAILED = 'failed',
  PASSED = 'passed',
  SKIPPED = 'skipped',
  TODO = 'todo',
  PENDING = 'pending',
}

export type ITestReport = {
  title: string,
  status: ITestStatus,
  regression: boolean,
  regressionMessage: string,
  duration: number,
  error: Error | null,
}

export type IGroupReport = {
  title: string,
  status: IGroupStatus,
  error: Error | null,
}

export type ITestRecord = {
  regressionCount: number,
  passedCount: number,
  skippedCount: number,
  failedCount: number,
  total: number,
  todoCount: number,
  tests: { group: string, title: string, error: Error }[],
}

export type ICallback <T extends any[]> = (...args: T) => Promise<void> | void
export type IResolver <T> = (done: Function) => T
