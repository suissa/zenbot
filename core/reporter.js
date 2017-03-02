const colors = require( 'colors' )
const n = require( 'numbro' )
const o = require( 'object-get' )

module.exports = ( get, set, clear ) =>
  ( tick, rs, cb ) => {

    const c = get( 'config' )
    const cols = []
    const g = { tick, rs, cols }

    if ( c.reporter_sizes.indexOf( tick.size ) === -1 || 
        !tick.data.trades ) return cb()

    const mapCols = ( i ) => get( 'reporter_cols.' + i )
    const reporter_cols = c.reporter_cols.map( mapCols )

    apply_funcs( g, reporter_cols, ( err, g ) => 
      ( err )
        ? cb( err )
        : get( 'logger' ).info( 'reporter', g.cols.join(' ')) && cb()
    )
  }
