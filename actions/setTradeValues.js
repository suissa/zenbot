module.exports = ( rs, n ) => {
  rs.min_trade = n(rs.product.min_size).multiply(1).value()
  rs.sim_start_balance = 10000
  rs.min_double_wait = 86400000 * 1 // wait in ms after action before doing same action
  rs.min_reversal_wait = 86400000 * 0.75 // wait in ms after action before doing opposite action
  rs.min_performance = -0.015 // abort trades with lower performance score
  return rs
}