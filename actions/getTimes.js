module.exports = ( get ) => {
  let get_timestamp = get('utils.get_timestamp')
  let get_duration = get('utils.get_duration')
  let get_tick_str = get('utils.get_tick_str')

  return { get_timestamp, get_duration, get_tick_str }
}