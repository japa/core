'use strict'

const createScraper = require('json-scrape')
const chalk = require('chalk')

const colors = {
  passed: 'grey',
  failed: 'red',
  todo: 'cyan',
  skipped: 'yellow'
}

const scraper = createScraper()
scraper.on('data', function (stats) {
  if (stats.event && stats.event === 'test:end') {
    const color = chalk[colors[stats.status]]
    console.log(`${color(stats.status.toUpperCase() + ' ' + stats.title)}`)
  }
})

process.stdin
.pipe(scraper)
.on('error', console.log)
