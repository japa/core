'use strict'
/* istanbul ignore next */

const ygor = require('ygor')
const semver = require('semver')
const exec = require('shelljs').exec
const path = require('path')

const satisfies = semver.satisfies(process.version, '>=7.0.0')
let filesToIgnore = []
let harmonyFlags = []
if (!satisfies) {
  filesToIgnore.push('async.spec.js')
} else {
  harmonyFlags.push('--harmony-async-await')
}

ygor.task('test', () => {
  require('require-all')({
    dirname: path.join(__dirname, './test'),
    filter: (fileName) => {
      return filesToIgnore.indexOf(fileName) <= -1
    }
  })
})

ygor.task('coverage', () => {
  const command = `FORCE_COLOR=true node ${harmonyFlags.join(' ')} ./node_modules/.bin/istanbul cover -x tasks.js tasks.js test`
  exec(command, (code, stdout, stderr) => {
    process.stderr.write(stderr)
    process.stdout.write(stdout)
    process.exit(code)
  })
})
