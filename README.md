# Goals

- [x] Simple and clean.
- [x] Options for running async tasks - via promises, async/await, generators and synchronous
- [x] Runnable without CLI.
- [x] Stream result as JSON.
- [ ] Reporters to pipe into stream and change the result output.
- [x] Test events every time a test completes.
- [ ] Test tags - to run specific tests only.
- [x] Able to skip tests
- [x] Able to mark task as todo. Same is done without passing the closure.
- [x] Single test timeouts
- [x] Retry test.
- [ ] Optionally bundle tests inside a module.

```js
test('create a user', function (assert, done) {
  assert.plan(1)
  assert.equal(1, 1)
  done()
}).timeout(5000).retry(5)

test.skip() // skipped
test('') // pending
```

Or

```js
const { test, module } = require('micro')

module('Users', function () {
  test('create another user', async function (assert, done) {
  })
})
```
