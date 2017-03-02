
const assert = require('assert')

module.exports = ( get, o, options, first_run, n, tb ) => 
  (tick, trigger, rs, cb) => {
    // console.log('\n\t\trsi')
    var rsi_tick_id = tb(tick.time).resize(rs.rsi_period).toString()
    if (rs.rsi && rs.rsi_tick_id && rs.rsi_tick_id !== rsi_tick_id) {
      // rsi period turnover. record last rsi for smoothing.
      rs.last_rsi = JSON.parse(JSON.stringify(rs.rsi))
      rs.rsi.samples++
      //console.error('last rsi', rs.last_rsi)
    }
    rs.rsi_tick_id = rsi_tick_id
    cb()
  }