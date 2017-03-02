module.exports = ( rs, c ) => {
  rs.rsi_query_limit = 100 // RSI initial value lookback
  rs.rsi_periods = 26 // RSI smoothing factor
  rs.rsi_period = '5m' // RSI tick size
  rs.rsi_up = 65 // upper RSI threshold
  rs.rsi_down = 28 // lower RSI threshold
  rs.check_period = '1m' // speed to trigger actions at
  rs.selector = 'data.trades.' + c.default_selector
  rs.trade_pct = 0.98 // trade % of current balance
  rs.fee_pct = 0.0025 // apply 0.25% taker fee

  return rs
}