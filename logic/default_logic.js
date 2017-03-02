const assert = require('assert')
const n = require('numbro')
const tb = require('timebucket')
const sig = require('sig')
const CoinbaseExchange = require('coinbase-exchange')
let first_run = true
let last_balance_sig
let sync_start_balance = false
global.client = false

module.exports = function container (get, set, clear) {
  let c = get('config')
  let o = get('utils.object_get')
  let format_currency = get('utils.format_currency')
  let { get_timestamp, get_duration, get_tick_str } = require('../actions/getTimes')( get )
  let options = get('options')
  let start = new Date().getTime()

  function onOrder (err, resp, order) {
    if (err) 
      return get('logger')
                 .error('order err', err, resp, order, {feed: 'errors'})
    
    if (resp.statusCode !== 200) 
      return get('logger').error( 'non-200 status: ' + resp.statusCode, 
                                  {data: {statusCode: resp.statusCode, body: order}})

    get('logger')
        .info('gdax', c.default_selector.grey, 
              ('order-id: ' + order.id).cyan, {data: {order: order}})

    return require('../actions/getStatus')(get, order)
  }

  const config = {
    get, c, n, o, tb, options, first_run, start, sync_start_balance
  }

  return require('../actions/fns')(config)
}
