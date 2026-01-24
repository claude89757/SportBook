import request from '@/utils/request'

// 订单确认（从购物车获取订单信息）
export function orderConfirm(data: {
  cartId: string
  new?: number
  store_id?: number
  addressId?: number
  shipping_type?: number
  couponId?: number
  spaceCardId?: number
}) {
  return request.post('/order/confirm', data)
}

// 创建订单（使用 orderKey）
export function createOrder(orderKey: string, data: {
  payType: string      // 'weixin' | 'yue'
  mark?: string        // 备注
  from?: string        // 'h5'
  [key: string]: any
}) {
  return request.post('/order/create/' + orderKey, data)
}

// 获取订单列表（通用订单）
export function getOrderList(params?: {
  type?: string
  status?: number | string
  page?: number
  limit?: number
}) {
  return request.get('/order/list', { params })
}

// 获取卡项订单列表（场地卡、次卡等）
// status: '' = 全部, 1 = 待付款, 2 = 已支付, 3 = 已退款, 4 = 已删除
export function getCardOrderList(params?: {
  status?: number | string
  page?: number
  limit?: number
}) {
  return request.get('/public_order/order_list', { params })
}

// 获取订单详情
export function getOrderDetail(orderId: number | string) {
  return request.get('/public_order/order_info/' + orderId)
}

// 取消订单（通用订单）
export function cancelOrder(orderId: number | string) {
  return request.post('/order/cancel', { id: orderId })
}

// 取消场地预约记录（type=11 的订单使用此接口）
export function cancelSpaceRecord(recordId: number | string) {
  return request.get('/sports/space_record/cancel', { params: { id: recordId } })
}

// 获取我的场地预约记录
export function getMySpaceRecords(params?: {
  page?: number
  limit?: number
  order_id?: string  // 可以按订单号筛选
}) {
  return request.get('/sports/my/space_records', { params })
}

// 申请退款
export function refundOrder(orderId: number | string, data?: {
  text?: string      // 退款原因
  refund_reason_wap_img?: string[]  // 退款图片
  refund_reason_wap_explain?: string  // 退款说明
}) {
  return request.post(`/order/refund/apply/${orderId}`, data || {
    text: '申请退款',
    refund_reason_wap_explain: '用户申请退款'
  })
}

// 取消卡项订单
export function cancelCardOrder(orderId: number | string) {
  return request.post('/public_order/cancel', { id: orderId })
}

// 订单支付
export function payOrder(data: {
  uni: number | string      // order_id
  paytype: string           // 'yue' | 'weixin' | 'alipay'
  from?: string             // 来源，h5
  [key: string]: any
}) {
  return request.post('/public_order/pay', data)
}

// 获取卡项列表
export function getCardList(params?: {
  category_id?: number | string
  page?: number
  limit?: number
}) {
  return request.get('/card/list', { params })
}

// 获取卡项详情
export function getCardDetail(cardId: number | string) {
  return request.get('/card/detail', {
    params: { card_id: cardId }
  })
}

// 购买卡项
export function buyCard(data: {
  card_id: number | string
  pay_type: string
  [key: string]: any
}) {
  return request.post('/card/buy', data)
}

// 获取我的卡项
export function getMyCards(params?: {
  status?: number | string
  page?: number
  limit?: number
}) {
  return request.get('/user/card/list', { params })
}

// 获取余额记录
// type: 0=全部, 1=消费, 2=充值
export function getBalanceLog(params?: {
  page?: number
  limit?: number
}, type: number | string = 0) {
  return request.get(`/v2/user/money_list/${type}`, { params })
}

// 获取用户预约记录
export function getBookingList(params?: {
  type?: string
  status?: number | string
  page?: number
  limit?: number
}) {
  return request.get('/user/booking/list', { params })
}
