
const assert = require('assert')

module.exports = ( get, c, options, first_run, n ) => ( tick, trigger, rs, cb ) => {
  // console.log('\n\t\tBEGIN DEFAULT TRADE LOGIC')
  const sMatch = c.default_selector.match(/^([^\.]+)\.([^-]+)-([^-]+)$/)

  assert(sMatch)

  // console.log('rs', rs)
  rs = require('./setDefaultExchangeValues')( rs, USER_AGENT, sMatch )
  rs = require('./setInitialValues.js')( rs, c )
  // console.log('rs', rs)
  if (options.verbose && get('command') === 'run') {
    get('logger')
      .info(  'trader', c.default_selector.grey, 
              get_tick_str(tick.id), 'running logic'.grey, rs.asset.grey, 
              rs.currency.grey, {feed: 'trader'})
  }


  var products = get('exchanges.' + rs.exchange).products
  products.forEach(function (product) {
    if (product.asset === rs.asset && product.currency === rs.currency)
      rs.product = product
  })
  if (!rs.product) return cb(new Error('no product for ' + c.default_selector))

  rs = require('../actions/setTradeValues')( rs, n )
  if (first_run) delete rs.real_trade_warning

  cb()
}