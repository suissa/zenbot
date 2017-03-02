
module.exports = ( get, o, options, c, n ) => 
  (tick, trigger, rs, cb) => {
    // console.log('\n\t\t detect trends from rsi')
    var trend
    var r = rs.rsi
    if (!r) {
      return cb()
    }
    if (r.samples < rs.rsi_periods) {
      if (!rs.rsi_warning) {
        // get('logger').info('trader', c.default_selector.grey, (rs.rsi_period + ' RSI: not enough samples for tick ' + rs.rsi_tick_id + ': ' + rs.rsi.samples).red, {feed: 'trader'})
      }
      rs.rsi_warning = true
    }
    else {
      if (r.value >= rs.rsi_up) {
        trend = 'UP'
      }
      else if (r.value <= rs.rsi_down) {
        trend = 'DOWN'
      }
      else {
        trend = null
      }
    }
    if (trend !== rs.trend) {
      get('logger').info('trader', c.default_selector.grey, 'RSI:'.grey + r.ansi, ('trend: ' + rs.trend + ' -> ' + trend).yellow, {feed: 'trader'})
      delete rs.balance_warning
      delete rs.roi_warning
      delete rs.rsi_warning
      delete rs.delta_warning
      delete rs.buy_warning
      delete rs.perf_warning
      delete rs.action_warning
      delete rs.trend_warning
    }
    rs.trend = trend
    cb()
  }