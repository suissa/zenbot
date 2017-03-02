
const assert = require('assert')

module.exports = ( get, o, options, first_run, n ) => 
  (tick, trigger, rs, cb) => {
        // console.log('\n\t\t calculate the smoothed rsi')
      if (!rs.market_price || !rs.rsi || !rs.last_rsi) {
        return cb()
      }
      var r = rs.rsi
      //console.error('market', rs.market_price, rs.rsi)
      r.close = rs.market_price
      r.last_close = rs.last_rsi.close
      r.current_gain = r.close > r.last_close ? n(r.close).subtract(r.last_close).value() : 0
      r.current_loss = r.close < r.last_close ? n(r.last_close).subtract(r.close).value() : 0
      r.last_avg_gain = rs.last_rsi.avg_gain
      r.last_avg_loss = rs.last_rsi.avg_loss
      r.avg_gain = n(r.last_avg_gain).multiply(rs.rsi_periods - 1).add(r.current_gain).divide(rs.rsi_periods).value()
      r.avg_loss = n(r.last_avg_loss).multiply(rs.rsi_periods - 1).add(r.current_loss).divide(rs.rsi_periods).value()
      if (r.avg_loss === 0) {
        r.value = r.avg_gain ? 100 : 50
      }
      else {
        r.relative_strength = n(r.avg_gain).divide(r.avg_loss).value()
        r.value = n(100).subtract(n(100).divide(n(1).add(r.relative_strength))).value()
      }
      r.ansi = n(r.value).format('0')[r.value > 70 ? 'green' : r.value < 30 ? 'red' : 'white']
      //console.error('smooth 2', r.close, r.last_close, r.ansi)
      //process.exit()
      cb()
    }