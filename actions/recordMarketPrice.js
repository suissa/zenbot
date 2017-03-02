
const assert = require('assert')

module.exports = ( get, o, options, first_run, n, sync_start_balance ) => 
  (tick, trigger, rs, cb) => {
      // console.log('\n\t\trecord')
      // note the last close price
      var market_price = o(tick, rs.selector + '.close')
      // sometimes the tick won't have a close price for this selector.
      // keep old close price in memory.
      if (market_price) {
        rs.market_price = market_price
      }
      if (tick.size !== rs.check_period) {
        return cb()
      }
      delete rs.lookback_warning
      rs.ticks || (rs.ticks = 0)
      rs.progress || (rs.progress = 0)
      if (!rs.market_price) {
        //get('logger').info('trader', ('no close price for tick ' + tick.id).red, {feed: 'trader'})
        return cb()
      }
      if (!rs.balance) {
        // start with start_balance, neutral position
        rs.balance = {}
        rs.balance[rs.currency] = n(rs.start_balance).divide(2).value()
        rs.balance[rs.asset] = n(rs.start_balance).divide(2).divide(rs.market_price).value()
      }
      rs.consolidated_balance = n(rs.balance[rs.currency]).add(n(rs.balance[rs.asset]).multiply(rs.market_price)).value()
      if (sync_start_balance) {
        rs.start_balance = rs.consolidated_balance
        sync_start_balance = false
      }
      rs.roi = n(rs.consolidated_balance).divide(rs.start_balance).value()
      rs.ticks++
      cb()
    }