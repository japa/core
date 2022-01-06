const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

async function foo() {
  console.log('sleep')
  await sleep(5000)
  console.log('done')
}

async function fooWithDone(done) {
  console.log('sleep')
  await sleep(5000)
  console.log('sleep over')
  setTimeout(() => {
    console.log('done')
    throw new Error('foooo')
    done()
  }, 3000)
  // throw new Error('foo')
}

async function run() {
  return new Promise((resolve, reject) => {
    function uncaughtExceptionHandler(error) {
      process.removeListener('uncaughtException', uncaughtExceptionHandler)
      reject(error)
    }
    process.on('uncaughtException', uncaughtExceptionHandler)

    const done = (error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }
    fooWithDone(done).catch(reject)
  })
}

run()
  .then(console.log)
  .catch((error) => console.log({ error }))
