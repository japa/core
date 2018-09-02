export enum IEvents {
  TESTSTARTED = 'test:started',
  TESTCOMPLETED = 'test:completed',
  GROUPSTARTED = 'group:started',
  GROUPCOMPLETED = 'group:completed',
}

export type IOptions = {
  bail: boolean,
}

export type ITestOptions = {
  timeout: number,
  regression: boolean,
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
  REGRESSION = 'regression',
  TODO = 'todo',
  PENDING = 'pending',
}

export type ITestReport = {
  title: string,
  status: ITestStatus,
  regressionMessage: string,
  duration: number,
  error: Error | null,
}

export type IGroupReport = {
  title: string,
  status: IGroupStatus,
  error: Error | null,
}

export type ICallback <T extends any[]> = (...args: T) => Promise<void> | void
export type IResolver <T> = (done: Function) => T
