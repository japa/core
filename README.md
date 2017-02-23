![Japa](http://res.cloudinary.com/adonisjs/image/upload/v1484834197/monk_di16hz.png)

Japa is a batteries included minimal testing framework for Node.Js. Japa does not have any cli to run your tests, infact running the test file as a node script will execute the tests for you (quite similar to tape).

* [Installation](#installation)
* [Why Japa?](#why-japa)
   * [Minimal Core](#minimal-core)
   * [ES2015..2017 Friendly](#es20152017-friendly)
   * [Embedable](#embedable)
   * [Pretty Output](#pretty-output)
   * [Human Readable Diff](#human-readable-diff)
* [Batteries Included](#batteries-included)
   * [Multiple Test Formats](#multiple-test-formats)
   * [Assertions Planning](#assertions-planning)
   * [Timeouts](#timeouts)
   * [Retry Flaky Tests](#retry-flaky-tests)
   * [Skip Tests](#skip-tests)
   * [Failing/Regression Tests](#failingregression-tests)
   * [Grouping Tests](#grouping-tests)
* [Globals](#globals)
    * [bail](#bail)
    * [timeout](#timeout)
    * [use](#use)
* [Assertion](#assertion)
* [API](#api)
    * [test(title, callback)](#testtitle-callback)
    * [test.skip(title, callback)](#testskiptitle-callback)
    * [test.failing(title, callback)](#testfailingtitle-callback)
    * [timeout(milliseconds)](#timeoutmilliseconds)
    * [retry(ops)](#retryops)
    * [group(title, callback)](#grouptitle-callback)
* [Events](#events)

---

<br />

## Installation
Japa needs **Node.js >= 6.0.0**.

```bash
npm i --save japa
```

---

<br /><br />


## Why Japa?
Below is the list of specific reasons to choose Japa over any other testing framework.

### Minimal Core
Japa core is so minimal and only focuses on building your tests, not running them.

---

### ES2015..2017 Friendly
Japa harness the goodness of ES2105 and later. You can define your tests as **async** methods or **return a Promise** from your tests.

---

### Embedable
It comes with fully-fledged API, which can be used to build your own test runners.

---

### Pretty Output
The default test reporter output is as pretty as Mocha spec reporter. Check below screenshot.

![](http://res.cloudinary.com/adonisjs/image/upload/v1484829443/Screenshot_2017-01-19_18.06.06_r1m0gq.png)

---

### Human Readable Diff
Majority of test runners outputs assertions diff quite similar to GIT. Which is great when diffing code, but not when reading failing test reports. Japa has a simple and clean **diff viewer**.
![](http://res.cloudinary.com/adonisjs/image/upload/v1484832296/Screen_Shot_2017-01-19_at_6.54.38_PM_yxaktv.png)

<br />

---

## Batteries Included

Japa minimal core does not limit the functionalities you get with it. It covers all the use cases of writing tests and offers explicit API's for them.

### Multiple Test Formats
You can write your tests as **async** functions, **return a Promise** or make use of traditional **done** style callbacks

```javascript
test('Async test', async (assert) => {
  const result = await someTimeConsumingWork()
})

test('Returns promise', (assert) => {
  return new Promise(() => {
  })
})

test('Traditional callbacks', (assert, done) => {
  fs.readFile(path, (error, contents) => {
    if(error) {
      return done(error)
    }

    assert.equal(contents, 'All good')
    done()
  })
})
```

---

### Assertions Planning
At times your test passes, since the failing code is not reachable by your test files. It is always a good idea
to plan assertions to these kind of scanerios.

```javascript
const test = require('japa')

test('Planning assertions', async (assert) => {
  assert.plan(2)
  const users = await User.all()

  assert.isArray(users)
  assert.deepEqual(users[0], { username: '...' })
})
```

---

### Timeouts
You can define timeout for each test when defining them.

```javascript
const test = require('japa')

test('This is the slow one', (assert) => {
  
}).timeout(5000)
```

---

### Retry Flaky Tests
We all deal with flaky tests, which needs to be retried couple of times before they can pass.

> The below test will run for 4 times (3 retries + 1 original run cycle) before failing.

```javascript
const test = require('japa')

test('I am so flaky', (assert) => {
  
}).retry(3)
```

---

### Skip Tests
Got a bug that needs some love? Skip it's tests until it get's fixed.

```javascript
const test = require('japa')

test.skip('I will be skipped', (assert) => {
  
})
```

---

### Failing/Regression Tests
When bugs spotted, your users can create a PR with failing test instead of creating issues. Tests started with `failing` will not break the test suite.

```javascript
const test = require('japa')

test.failing('Some regression here', (assert) => {
  assert.fail(2, 4, 'Expected 2 to be equal to 2 but got 4')
})
```

![](http://res.cloudinary.com/adonisjs/image/upload/v1484831298/Screen_Shot_2017-01-19_at_6.37.54_PM_i8dmrp.png)

---

### Grouping Tests
It is a good practice to keep your tests flat and not be depedented on any global state. But at times you may want to execute cleanup/setup methods before and after tests.

It is a good idea to group tests and perform clean tasks inside life cycle hooks.

#### before
Will run before all the tests in the group.

```javascript
const test = require('japa')

test.group('Some Module', (group) => {
  group.before(async () => {
  })
})
```

#### beforeEach
Will run before each test in the group.

```javascript
const test = require('japa')

test.group('Some Module', (group) => {
  group.beforeEach(async () => {
  })
})
```

#### after
Will run after all the tests in the group.

```javascript
const test = require('japa')

test.group('Some Module', (group) => {
  group.after(async () => {
  })
})
```

#### afterEach
Will run after each test in the group.

```javascript
const test = require('japa')

test.group('Some Module', (group) => {
  group.afterEach(async () => {
  })
})
```

<br />

---


## Globals

Below is the list of settings/options which can turn on/off globally.

#### bail
Test suite doesn't stop on test failures and continue to run. The `bail` method can be used to stop executing the test after first failure.

```javascript
const test = require('japa')

test.bail(true)

test('title', () => {
})
```

#### timeout
Instead of defining timeout for each test, you can define them once for all tests.

```javascript
const test = require('japa')

test.timeout(5000)

test('title', () => {
})
```

#### use
Japa makes use of the `list` reporter bundled with the core. You can attach your own reporter by making use of the `use` method.

```javascript
const test = require('japa')

test.use(function (emitter) {
  emitter.on('test:end', console.log)
})

test('title', () => {
})
```

<br />

---

## Assertion
Japa makes use of [ChaiJs Assertion Library](http://chaijs.com/api/assert/). Make sure to read their docs.

<br />

---


## API
Here is the list of all the testing methods

#### test(title, callback)
Write a new test

```javascript
test('title', (assert) => {})
```

#### test.skip(title, callback)
Create a test to be skipped

```javascript
test.skip('title', (assert) => {})
```

#### test.failing(title, callback)
Create a test which is expected to be failed

```javascript
test.failing('title', (assert) => {})
```

#### timeout(milliseconds)
How long to wait for test to finish.

```javascript
test('title', (assert) => {
  
}).timeout(5000)
```

#### retry(ops)
How many times to retry a test before marking it as fail. The `retry` only happens when test keeps on failing

```javascript
test('title', (assert) => {
  
}).retry(2)
```

#### group(title, callback)
Create a new test group/suite. Nested groups are not allowed.

```javascript
test.group('Module name', (group) => {
  
  group.after(async () => >{
    await Db.clear()
  })

})
```

#### grep(substring)
Filter and only run tests that contains the given substring.

```javascript
test.grep('foo')

test('bar', () => {
  console.log('Not executed')
})

test('foo', () => {
  console.log('Executed')
})
```


## Events

Below is the list of events, you can listen for when writing for your reporters.

You can grab the instance of emitter by import the following file

```
const emitter = require('japa/lib/emitter')
emitter.on('test:end', function (payload) {
})
```

<details>
    <summary> group:start </summary>
Emitted whenever a new group has been started. It includes the following payload.

```javascript
{
    title: 'GROUP TITLE',
    status: 'pending'
}
```
</details>

<details>
<summary> group:end </summary>
Emitted whenever all the tests inside a group have been executed. It includes the following payload.

```javascript
  {
    title: 'GROUP TITLE',
    status: 'failed | passed',
    errors: [Array of errors for all failing tests]
  }
```
</details>

<details>
<summary> test:start </summary>
Emitted whenever a new test starts.

```javascript
{
  title: 'TEST TITLE',
  status: 'todo | skipped',
  regression: 'true | false'
}
```
</details>

<details>
<summary> test:end </summary>
Emitted whenever a test ends.

```javascript
{
  title: 'TEST TITLE',
  status: 'todo | skipped | failed | passed',
  timeout: 'true | false',
  error: 'Error if failed',
  regression: 'true | false',
  regressionMessage: 'Error message of regression test (if regression)'
}
```
</details>

<details>
<summary> hook:before:start </summary>
Emitted whenever before hook execution has started.
</details>

<details>
<summary> hook:before:end </summary>
Emitted whenever before hook execution has ended.
</details>

<details>
<summary> hook:beforeEach:start </summary>
Emitted whenever beforeEach hook execution has started.
</details>

<details>
<summary> hook:beforeEach:end </summary>
Emitted whenever beforeEach hook execution has ended.
</details>

<details>
<summary> hook:after:start </summary>
Emitted whenever after hook execution has started.
</details>

<details>
<summary> hook:after:end </summary>
Emitted whenever after hook execution has ended.
</details>

<details>
<summary> hook:afterEach:start </summary>
Emitted whenever afterEach hook execution has started.
</details>

<details>
<summary> hook:afterEach:end </summary>
Emitted whenever afterEach hook execution has ended.
</details>
