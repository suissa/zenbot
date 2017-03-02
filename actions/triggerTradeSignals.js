
const assert = require('assert')

module.exports = ( get, o, options, n, c, start ) => 
  (tick, trigger, rs, cb) => {
      // console.log('\n\t\t trigger trade signals from trends')
    if (tick.size !== rs.check_period) {
      return cb()
    }
    // for run command, don't trade unless this is a new tick
    if (get('command') !== 'sim' && tick.time < start) {
      get('logger').info('trader', c.default_selector.grey, ('skipping historical tick ' + tick.id).grey, {feed: 'trader'})
      return cb()
    }
    if (rs.trend) {
      if (!rs.trend_warning && !rs.balance) {
        get('logger').info('trader', c.default_selector.grey, ('no balance to act on trend: ' + rs.trend + '!').red, {feed: 'trader'})
        rs.trend_warning = true
      }
      else if (!rs.trend_warning && !rs.market_price) {
        get('logger').info('trader', c.default_selector.grey, ('no market_price to act on trend: ' + rs.trend + '!').red, {feed: 'trader'})
        rs.trend_warning = true
      }
    }
    rs.progress = 1
    if (rs.trend && rs.balance && rs.market_price) {
      var size, new_balance = {}
      if (rs.trend === 'DOWN') {
        // calculate sell size
        size = rs.balance[rs.asset]
      }
      else if (rs.trend === 'UP') {
        // calculate buy size
        size = n(rs.balance[rs.currency]).divide(rs.market_price).value()
      }
      size = n(size || 0).multiply(rs.trade_pct).value()
      if (rs.trend === 'DOWN') {
        // SELL!
        if (rs.last_sell_time && tick.time - rs.last_sell_time <= rs.min_double_wait) {
          if (!rs.sell_warning) {
            get('logger').info('trader', c.default_selector.grey, ('too soon to sell after sell! waiting ' + get_duration(n(rs.min_double_wait).subtract(n(tick.time).subtract(rs.last_sell_time)).multiply(1000).value())).red, {feed: 'trader'})
          }
          rs.sell_warning = true
          return cb()
        }
        if (rs.last_buy_time && tick.time - rs.last_buy_time <= rs.min_reversal_wait) {
          if (!rs.sell_warning) {
            get('logger').info('trader', c.default_selector.grey, ('too soon to sell after buy! waiting ' + get_duration(n(rs.min_reversal_wait).subtract(n(tick.time).subtract(rs.last_buy_time)).multiply(1000).value())).red, {feed: 'trader'})
          }
          rs.sell_warning = true
          return cb()
        }
        new_balance[rs.currency] = n(rs.balance[rs.currency]).add(n(size).multiply(rs.market_price)).value()
        new_balance[rs.asset] = n(rs.balance[rs.asset]).subtract(size).value()
        rs.op = 'sell'
        if (!rs.action_warning) {
          get('logger').info('trader', c.default_selector.grey, ('attempting to sell ' + n(size).format('0.00000000') + ' ' + rs.asset + ' for ' + format_currency(n(size).multiply(rs.market_price).value(), rs.currency) + ' ' + rs.currency).yellow, {feed: 'trader'})
        }
        rs.action_warning = true
      }
      else if (rs.trend === 'UP') {
        // BUY!
        if (rs.last_buy_time && tick.time - rs.last_buy_time <= rs.min_double_wait) {
          if (!rs.buy_warning) {
            get('logger').info('trader', c.default_selector.grey, ('too soon to buy after buy! waiting ' + get_duration(n(rs.min_double_wait).subtract(n(tick.time).subtract(rs.last_buy_time)).multiply(1000).value())).red, {feed: 'trader'})
          }
          rs.buy_warning = true
          return cb()
        }
        if (rs.last_sell_time && tick.time - rs.last_sell_time <= rs.min_reversal_wait) {
          if (!rs.buy_warning) {
            get('logger').info('trader', c.default_selector.grey, ('too soon to buy after sell! waiting ' + get_duration(n(rs.min_reversal_wait).subtract(n(tick.time).subtract(rs.last_sell_time)).multiply(1000).value())).red, {feed: 'trader'})
          }
          rs.buy_warning = true
          return cb()
        }
        new_balance[rs.asset] = n(rs.balance[rs.asset]).add(size).value()
        new_balance[rs.currency] = n(rs.balance[rs.currency]).subtract(n(size).multiply(rs.market_price)).value()
        rs.op = 'buy'
        if (!rs.action_warning) {
          get('logger').info('trader', c.default_selector.grey, ('attempting to buy ' + n(size).format('0.00000000') + ' ' + rs.asset + ' for ' + format_currency(n(size).multiply(rs.market_price).value(), rs.currency) + ' ' + rs.currency).yellow, {feed: 'trader'})
        }
        rs.action_warning = true
      }
      else {
        // unknown trend
        get('logger').info('trader', c.default_selector.grey, ('unkown trend (' + rs.trend + ') aborting trade!').red, {feed: 'trader'})
        return cb()
      }
      // min size
      if (!size || size < rs.min_trade) {
        if (!rs.balance_warning) {
          get('logger').info('trader', c.default_selector.grey, 'trend: '.grey, rs.trend, ('not enough funds (' + (rs.op === 'sell' ? n(size).format('0.00000000') : format_currency(rs.balance[rs.currency], rs.currency)) + ' ' + (rs.op === 'sell' ? rs.asset : rs.currency) + ') to execute min. ' + rs.op + ' ' + rs.min_trade + ', aborting trade!').red, {feed: 'trader'})
        }
        rs.balance_warning = true
        return cb()
      }
      // fee calc
      rs.fee = n(size).multiply(rs.market_price).multiply(rs.fee_pct).value()
      new_balance[rs.currency] = n(new_balance[rs.currency]).subtract(rs.fee).value()
      // consolidate balance
      rs.new_end_balance = n(new_balance[rs.currency]).add(n(new_balance[rs.asset]).multiply(rs.market_price)).value()
      rs.new_roi = n(rs.new_end_balance).divide(rs.start_balance).value()
      rs.new_roi_delta = n(rs.new_roi).subtract(rs.roi || 0).value()

      if (rs.op === 'buy') {
        // % drop
        rs.performance = rs.last_sell_price ? n(rs.last_sell_price).subtract(rs.market_price).divide(rs.last_sell_price).value() : null
      }
      else {
        // % gain
        rs.performance = rs.last_buy_price ? n(rs.market_price).subtract(rs.last_buy_price).divide(rs.last_buy_price).value() : null
      }
      if (rs.min_performance && rs.performance !== null && rs.performance < rs.min_performance) {
        if (!rs.perf_warning) {
          get('logger').info('trader', c.default_selector.grey, ('aborting ' + rs.op + ' due to low perf. = ' + n(rs.performance).format('0.000')).red, {feed: 'trader'})
        }
        rs.perf_warning = true
        return cb()
      }
      if (rs.op === 'buy') {
        rs.waited = rs.last_sell_time ? get_duration(n(tick.time).subtract(rs.last_sell_time).multiply(1000).value()) : null
        rs.last_buy_time = tick.time
      }
      else {
        rs.waited = rs.last_buy_time ? get_duration(n(tick.time).subtract(rs.last_buy_time).multiply(1000).value()) : null
        rs.last_sell_time = tick.time
      }
      rs.performance_scores || (rs.performance_scores = [])
      rs.performance_scores.push(rs.performance)
      var performance_sum = rs.performance_scores.reduce(function (prev, curr) {
        return prev + curr
      }, 0)
      rs.performance_avg = n(performance_sum).divide(rs.performance_scores.length).value()
      rs.balance = new_balance
      rs.end_balance = rs.new_end_balance
      rs.roi = rs.new_roi
      rs.num_trades || (rs.num_trades = 0)
      rs.num_trades++
      var trade = {
        type: rs.op,
        asset: rs.asset,
        currency: rs.currency,
        exchange: rs.exchange,
        price: rs.market_price,
        fee: rs.fee,
        market: true,
        size: size,
        rsi: rs.rsi.value,
        roi: rs.roi,
        roi_delta: rs.new_roi_delta,
        performance: rs.performance,
        waited: rs.waited,
        balance: new_balance,
        end_balance: rs.new_end_balance
      }
      trigger(trade)
      if (global.client) {
        var params = {
          type: 'market',
          size: n(size).format('0.000000'),
          product_id: rs.asset + '-' + rs.currency
        }
        global.client[rs.op](params, function (err, resp, order) {
          onOrder(err, resp, order)
        })
      }
      else if (!rs.sim_warning) {
        get('logger').info('trader', c.default_selector.grey, ('Relax! This is a simulated trade! No real transaction will take place. --Zen').yellow, {feed: 'trader'})
        rs.sim_warning = true
      }
      if (rs.op === 'buy') {
        rs.last_buy_price = rs.market_price
      }
      else {
        rs.last_sell_price = rs.market_price
      }
      rs.last_op = rs.op
    }
    cb()
  }