
const assert = require('assert')

module.exports = ( get, c, options, first_run, n ) => 
  ( tick, trigger, rs, cb ) =>{
    // console.log('\n\t\tsync balance')
    if (get('command') !== 'run' || !c.gdax_key) {
      rs.start_balance = rs.sim_start_balance
      // add timestamp for simulations
      if (c.reporter_cols.indexOf('timestamp') === -1) {
        c.reporter_cols.unshift('timestamp')
        if (get('command') === 'run') {
          get('logger').info('trader', c.default_selector.grey, ('No trader API key provided. Starting in advisor mode. --Zen').yellow, {feed: 'trader'})
        }
      }
      if (get('command') === 'sim') {
        // change reporting interval for sims
        c.reporter_sizes = ['1h']
      }
      return cb()
    }
    if (!global.client) {
      global.client = new CoinbaseExchange.AuthenticatedClient(c.gdax_key, c.gdax_secret, c.gdax_passphrase)
    }
    global.client.getAccounts(function (err, resp, accounts) {
      if (err) throw err
      if (resp.statusCode !== 200) {
        console.error(accounts)
        get('logger').error('non-200 status from exchange: ' + resp.statusCode, {data: {statusCode: resp.statusCode, body: accounts}})
        return cb()
      }
      rs.balance = {}
      accounts.forEach(function (account) {
        if (account.currency === rs.currency) {
          rs.balance[rs.currency] = n(account.balance).value()
        }
        else if (account.currency === rs.asset) {
          rs.balance[rs.asset] = n(account.balance).value()
        }
      })
      if (first_run) {
        sync_start_balance = true
      }
      var balance_sig = sig(rs.balance)
      if (balance_sig !== last_balance_sig) {
        get('logger').info('trader', c.default_selector.grey, 'New account balance:'.cyan, n(rs.balance[rs.asset]).format('0.000').white, rs.asset.grey, format_currency(rs.balance[rs.currency], rs.currency).yellow, rs.currency.grey, {feed: 'trader'})
        if (!rs.real_trade_warning) {
          get('logger').info('trader', c.default_selector.grey, '"Starting REAL trading! Hold on to your butts!" --Zen'.cyan, {feed: 'trader'})
          rs.real_trade_warning = true
        }
        last_balance_sig = balance_sig
      }
      cb()
    })

  }