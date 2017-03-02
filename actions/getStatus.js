const getStatus (get, order) => {
  global.client.getOrder(order.id, function (err, resp, order) {

    if (err) return get('logger').error('getOrder err', err)
    if (resp.statusCode !== 200) {
      console.error(order)
      return get('logger').error('non-200 status from getOrder: ' + resp.statusCode, {data: {statusCode: resp.statusCode, body: order}})
    }

    const getStatusTimeout ( get ) =>
      get('logger').info('gdax', c.default_selector.grey, 
                        ('order ' + order.id + ' ' + order.status).cyan, 
                        {data: {order: order}})
      && setTimeout(getStatus, 5000)

    (order.status === 'done')
      ? get('logger').info('gdax', c.default_selector.grey, ('order ' + order.id + ' done: ' + order.done_reason).cyan, {data: {order: order}})
      : getStatusTimeout( get )
  })
}

module.exports = getStatus