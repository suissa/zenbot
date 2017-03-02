module.exports = ( rs, USER_AGENT, sMatch ) => {
  rs.agent = USER_AGENT
  rs.exchange = sMatch[1]
  rs.asset = sMatch[2]
  rs.currency = sMatch[3]
  return rs
}