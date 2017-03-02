module.exports = ( config ) => {
  let get = config.get
  let c = config.c
  let n = config.n
  let o = config.o
  let tb = config.tb
  let options = config.options
  let first_run = config.first_run
  let start = config.start
  let sync_start_balance = config.sync_start_balance

  return [
    // BEGIN DEFAULT TRADE LOGIC
    require('./defaultTradeLogic')( get, c, options, first_run, n ),
    require('./syncBalance')( get, c, options, first_run, n ),
    require('./recordMarketPrice')( get, o, options, first_run, n, sync_start_balance ),
    require('./calculateFirstRsiFromTicks')( get, c, options, first_run, n, tb ),
    require('./calculateFirstRsi')( get, o, options, n, c, tb ),
    require('./calculateSmoothedRsi')( get, c, options, first_run, n ),
    require('./detectTrendsFromRsi')( get, o, options, c, n ),
    (tick, trigger, rs, cb) => cb(),
    require('../actions/triggerTradeSignals')( get, o, options, n, c, start ),
    (tick, trigger, rs, cb) => {
      first_run = false
      cb()
    }
    // END DEFAULT TRADE LOGIC
  ]
}
