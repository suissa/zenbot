
const assert = require('assert')

module.exports = ( get, o, options, n, c, tb ) => 
(tick, trigger, rs, cb) => {
  // console.log('\n\t\toutro rsi')
  if (rs.first_rsi) {
    return cb()
  }
  // calculate first rsi
  //console.error('computing RSI', tick.id)
  var bucket = tb(tick.time).resize(rs.rsi_period)
  var params = {
    query: {
      app: get('app_name'),
      size: rs.rsi_period,
      time: {
        $lt: bucket.toMilliseconds()
      }
    },
    limit: rs.rsi_query_limit,
    sort: {
      time: -1
    }
  }
  params.query[rs.selector] = {$exists: true}
  get('ticks').select(params, function (err, lookback) {
    if (err) return cb(err)
    var missing = false
    if (lookback.length < rs.rsi_periods) {
      if (!rs.lookback_warning) {
        get('logger').info('trader', c.default_selector.grey, ('need more historical data, only have ' + lookback.length + ' of ' + rs.rsi_periods + ' ' + rs.rsi_period + ' ticks').yellow)
      }
      rs.lookback_warning = true
      return cb()
    }
    bucket.subtract(1)
    lookback.forEach(function (tick) {
      while (bucket.toMilliseconds() > tick.time) {
        get('logger').info('trader', c.default_selector.grey, ('missing RSI tick: ' + get_timestamp(bucket.toMilliseconds())).red)
        missing = true
        bucket.subtract(1)
      }
      //get('logger').info('trader', 'RSI tick OK:'.grey, get_timestamp(bucket.toMilliseconds()).green)
      bucket.subtract(1)
    })
    if (missing) {
      if (!rs.missing_warning) {
        get('logger').info('trader', c.default_selector.grey, 'missing tick data, RSI might be inaccurate. Try running `zenbot map --backfill` or wait for 3.6 for the new `zenbot repair` tool.'.red)
      }
      rs.missing_warning = true
    }
    if (!rs.missing_warning && !rs.rsi_complete_warning) {
      get('logger').info('trader', c.default_selector.grey, ('historical data OK! computing initial RSI from last ' + lookback.length + ' ' + rs.rsi_period + ' ticks').green)
      rs.rsi_complete_warning = true
    }
    withLookback(lookback.reverse())
  })
  function withLookback (lookback) {
    var init_lookback = lookback.slice(0, rs.rsi_periods + 1)
    var smooth_lookback = lookback.slice(rs.rsi_periods + 1)
    var de = o(init_lookback.pop(), rs.selector)
    var r = {}
    r.samples = init_lookback.length
    if (r.samples < rs.rsi_periods) {
      return cb()
    }
    r.close = de.close
    r.last_close = o(init_lookback[r.samples - 1], rs.selector).close
    r.current_gain = r.close > r.last_close ? n(r.close).subtract(r.last_close).value() : 0
    r.current_loss = r.close < r.last_close ? n(r.last_close).subtract(r.close).value() : 0
    var prev_close = 0
    var gain_sum = init_lookback.reduce(function (prev, curr) {
      curr = o(curr, rs.selector)
      if (!prev_close) {
        prev_close = curr.close
        return 0
      }
      var gain = curr.close > prev_close ? curr.close - prev_close : 0
      prev_close = curr.close
      return n(prev).add(gain).value()
    }, 0)
    var avg_gain = n(gain_sum).divide(r.samples).value()
    prev_close = 0
    var loss_sum = init_lookback.reduce(function (prev, curr) {
      curr = o(curr, rs.selector)
      if (!prev_close) {
        prev_close = curr.close
        return 0
      }
      var loss = curr.close < prev_close ? prev_close - curr.close : 0
      prev_close = curr.close
      return n(prev).add(loss).value()
    }, 0)
    var avg_loss = n(loss_sum).divide(r.samples).value()
    r.last_avg_gain = avg_gain
    r.last_avg_loss = avg_loss
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
    // first rsi, calculated from prev 14 ticks
    rs.last_rsi = JSON.parse(JSON.stringify(r))
    //console.error('first rsi', r)
    rs.rsi = r
    rs.first_rsi = rs.last_rsi = JSON.parse(JSON.stringify(r))
    smooth_lookback.forEach(function (de) {
      r.last_close = r.close
      r.close = o(de, rs.selector).close
      r.samples++
      r.current_gain = r.close > r.last_close ? n(r.close).subtract(r.last_close).value() : 0
      r.current_loss = r.close < r.last_close ? n(r.last_close).subtract(r.close).value() : 0
      r.last_avg_gain = r.avg_gain
      r.last_avg_loss = r.avg_loss
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
      rs.last_rsi = JSON.parse(JSON.stringify(r))
      //console.error('smooth', r.close, r.last_close, r.ansi)
    })
    cb()
  }
} 
