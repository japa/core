'use strict'

class StringCalcuator {
  add (expression) {
    if (!expression) {
      return 0
    }

    let total = 0
    expression.split(/,|\n/g).forEach((item) => {
      const value = Number(item) || 0
      if (value < 0) throw new Error(`${value} is not allowed.`)
      if (value >= 1000) return
      total += value
    })
    return total
  }
}

module.exports = StringCalcuator
