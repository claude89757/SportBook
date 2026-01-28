<template>
  <div class="order-page">
    <van-nav-bar title="我的订单" />

    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="全部" name="all" />
      <van-tab title="待使用" name="pending" />
      <van-tab title="已使用" name="used" />
      <van-tab title="已退款" name="refunded" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="order-list">
          <div
            v-for="item in orders"
            :key="item.order_id"
            class="order-card"
            :class="{ expanded: isExpanded(item.order_id) }"
          >
            <!-- 折叠状态：始终显示的摘要信息（2行布局） -->
            <div class="card-summary" @click="toggleExpand(item.order_id)">
              <!-- 第1行：场地+时间+状态+价格 -->
              <div class="summary-row">
                <div class="booking-info">
                  <span class="space-name">{{ getSpaceName(item) }}</span>
                  <span class="separator">·</span>
                  <span class="booking-time">{{ getBookingDateTimeShort(item) }}</span>
                </div>
                <div class="status-price">
                  <van-tag :type="getStatusType(item)" size="small">{{ getStatusText(item) }}</van-tag>
                  <span class="price">¥{{ item.pay_price || item.total_price || 0 }}</span>
                </div>
              </div>
              <!-- 第2行：展开按钮 -->
              <div class="expand-row">
                <van-icon :name="isExpanded(item.order_id) ? 'arrow-up' : 'arrow-down'" size="14" color="#999" />
              </div>
            </div>

            <!-- 展开状态：详细信息 -->
            <div class="card-detail" v-show="isExpanded(item.order_id)">
              <div class="detail-list">
                <div class="detail-item">
                  <span class="label">订单编号</span>
                  <span class="value">{{ item._baseOrderId || item.order_id }}</span>
                </div>
                <div class="detail-item" v-if="item.store_name">
                  <span class="label">门店</span>
                  <span class="value">{{ item.store_name }}</span>
                </div>
                <div class="detail-item" v-if="item.cartInfo && item.cartInfo.length > 1">
                  <span class="label">时段数量</span>
                  <span class="value">{{ item.cartInfo.length }} 个时段</span>
                </div>
                <div class="detail-item" v-if="item.add_time">
                  <span class="label">下单时间</span>
                  <span class="value">{{ formatTime(item.add_time) }}</span>
                </div>
                <div class="detail-item" v-else-if="item.create_time">
                  <span class="label">下单时间</span>
                  <span class="value">{{ item.create_time }}</span>
                </div>
                <div class="detail-item" v-if="item.mark">
                  <span class="label">备注</span>
                  <span class="value">{{ item.mark }}</span>
                </div>
                <div class="detail-item" v-else>
                  <span class="label">备注</span>
                  <span class="value text-muted">无</span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="card-actions" v-if="canCancel(item) || canRefund(item) || canPay(item)">
                <van-button
                  v-if="canCancel(item)"
                  size="small"
                  plain
                  type="danger"
                  @click.stop="cancelOrder(item)"
                >
                  取消订单
                </van-button>
                <van-button
                  v-if="canRefund(item)"
                  size="small"
                  plain
                  type="warning"
                  @click.stop="refundOrder(item)"
                >
                  取消预约
                </van-button>
                <van-button
                  v-if="canPay(item)"
                  size="small"
                  type="primary"
                  @click.stop="payOrder(item)"
                >
                  立即付款
                </van-button>
              </div>
            </div>
          </div>
        </div>

        <van-empty v-if="orders.length === 0 && !loading" description="暂无订单" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import { getOrderList, cancelOrder as apiCancelOrder, cancelSpaceRecord as apiCancelSpaceRecord, getMySpaceRecords, payOrder as apiPayOrder, refundOrder as apiRefundOrder } from '@/api/order'
import { formatDateWithWeekday } from '@/utils/date'

const activeTab = ref('all')
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const orders = ref<any[]>([])

// 折叠状态管理
const expandedOrders = ref<Set<string>>(new Set())

function toggleExpand(orderId: string) {
  const newSet = new Set(expandedOrders.value)
  if (newSet.has(orderId)) {
    newSet.delete(orderId)
  } else {
    newSet.add(orderId)
  }
  expandedOrders.value = newSet
}

function isExpanded(orderId: string): boolean {
  return expandedOrders.value.has(orderId)
}

// 判断预约日期是否已过期
function isBookingExpired(item: any): boolean {
  const bookingDate = item.cartInfo?.[0]?.date
  if (!bookingDate) return true // 无日期的视为已过期
  const today = new Date().toISOString().split('T')[0]
  return bookingDate < today
}

// Tab 筛选函数
type TabFilterFn = (item: any) => boolean
const tabFilterFns: Record<string, TabFilterFn> = {
  all: () => true,
  pending: (item) => item.paid === 1 && item.refund_status === 0 && !isBookingExpired(item),
  used: (item) => item.paid === 1 && item.refund_status === 0 && isBookingExpired(item),
  refunded: (item) => item.refund_status > 0
}

// 排序订单
function sortOrders(list: any[], tab: string): any[] {
  return [...list].sort((a, b) => {
    if (tab === 'all' || tab === 'refunded') {
      // 按下单时间倒序
      return (b.add_time || 0) - (a.add_time || 0)
    }
    if (tab === 'pending') {
      // 按场地日期升序（最近的在前）
      const dateA = a.cartInfo?.[0]?.date || '9999-12-31'
      const dateB = b.cartInfo?.[0]?.date || '9999-12-31'
      return dateA.localeCompare(dateB)
    }
    if (tab === 'used') {
      // 按场地日期倒序（最近使用的在前）
      const dateA = a.cartInfo?.[0]?.date || ''
      const dateB = b.cartInfo?.[0]?.date || ''
      return dateB.localeCompare(dateA)
    }
    return 0
  })
}

// 获取场地名称
function getSpaceName(item: any): string {
  return item.cartInfo?.[0]?.space_name || '场地'
}

// 获取预约日期时间（简洁格式）
function getBookingDateTime(item: any): string {
  if (!item.cartInfo?.length) return ''
  const first = item.cartInfo[0]
  const date = first.date ? formatDateWithWeekday(first.date) : ''
  const time = first.time_show || ''
  if (item.cartInfo.length === 1) {
    return `${date} ${time}`.trim()
  }
  return `${date} ${time} 等${item.cartInfo.length}个时段`
}

// 获取预约日期时间（用于折叠状态）
function getBookingDateTimeShort(item: any): string {
  if (!item.cartInfo?.length) return ''
  const first = item.cartInfo[0]
  const date = first.date ? formatDateWithWeekday(first.date) : ''  // "01-28 周三"
  // 显示所有时段，用逗号分隔
  const times = item.cartInfo.map((c: any) => c.time_show || '').filter(Boolean).join(', ')
  return `${date} ${times}`.trim()
}

// status 字段可能是: 0=待支付, 1=待发货, 2=待收货, 3=待评价, 4=已完成, 9=已取消
// paid 字段: 0=未支付, 1=已支付
// type 字段: 11=场地预约, 其他类型待补充
function getTypeName(item: any) {
  if (item.type_name) return item.type_name
  const type = item.type || item.product_type
  if (type === 11) return '场地预约'
  if (type === 0) return '商品订单'
  return '订单'
}

function getStatusType(item: any) {
  // 已删除/取消
  if (item.is_del === 1 || item.status === 9 || item.status === -1) return 'default'

  // 优先检查退款状态
  if (item.refund_status > 0 || item._status?._type === -2) {
    return 'warning'  // 已退款用橙色
  }

  // 优先用 _status 判断
  if (item._status?._title) {
    const title = item._status._title
    if (title.includes('退款')) return 'warning'
    if (title.includes('待')) return 'warning'
    if (title.includes('完成')) return 'success'
    if (title.includes('取消') || title.includes('删除')) return 'default'
  }

  // 待支付
  if (item.paid === 0) return 'warning'

  // 已支付
  if (item.paid === 1) {
    const type = item.type || item.product_type
    // 场地预约订单
    if (type === 11) {
      if (item.status <= 2) return 'primary' // 待使用/使用中
      return 'success' // 已完成
    }
    // 普通订单
    if (item.status >= 1 && item.status <= 3) return 'primary' // 待发货/待收货/待评价
    if (item.status === 4) return 'success' // 已完成
    return 'success'
  }

  return 'default'
}

function getStatusText(item: any) {
  // 先判断是否已删除/取消
  if (item.is_del === 1) return '已删除'
  if (item.status === 9 || item.status === -1) return '已取消'

  // 优先检查退款状态
  if (item.refund_status > 0) {
    if (item.refund_status === 1) return '退款中'
    if (item.refund_status === 2) return '已退款'
    return '已退款'
  }

  // 优先用 API 返回的 _status._title
  if (item._status?._title) return item._status._title

  // 兼容旧的 status_name 字段
  if (item.status_name) return item.status_name

  // 用 paid 判断支付状态
  if (item.paid === 0) return '待支付'

  // 已支付的订单，根据订单类型和 status 判断
  if (item.paid === 1) {
    const type = item.type || item.product_type
    // 场地预约订单
    if (type === 11) {
      // 根据预约日期判断
      if (isBookingExpired(item)) return '已使用'
      return '待使用'
    }
    // 普通商品订单
    if (item.status === 1) return '待发货'
    if (item.status === 2) return '待收货'
    if (item.status === 3) return '待评价'
    if (item.status === 4) return '已完成'
    return '已支付'
  }

  return '未知'
}

// 格式化时间戳
function formatTime(timestamp: number | string) {
  if (!timestamp) return ''
  // 如果是数字类型的时间戳
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  if (ts > 1000000000000) {
    // 毫秒时间戳
    return new Date(ts).toLocaleString('zh-CN')
  } else if (ts > 1000000000) {
    // 秒时间戳
    return new Date(ts * 1000).toLocaleString('zh-CN')
  }
  // 已经是格式化的字符串
  return timestamp
}

// 判断是否可以支付
function canPay(item: any) {
  // status=0 或 paid=0 表示待支付
  return (item.status === 0 || item.paid === 0) && item.is_del !== 1
}

// 判断是否可以取消订单（仅待付款订单）
function canCancel(item: any) {
  if (item.is_del === 1) return false
  if (item.status === 9 || item.status === -1) return false
  // 只有未支付的订单才能取消
  return item.paid === 0
}

// 判断是否可以申请退款/取消预约
function canRefund(item: any) {
  if (item.is_del === 1) return false
  if (item.status === 9 || item.status === -1) return false
  if (item.refund_status > 0) return false  // 已退款或退款中

  // 已支付的订单
  if (item.paid === 1) {
    const orderType = item.type || item.product_type

    // 场地预约订单 (type=11)：检查预约日期是否在未来
    if (orderType === 11 && item.cartInfo && item.cartInfo.length > 0) {
      // 获取最早的预约日期
      const firstBookingDate = item.cartInfo[0].date
      if (firstBookingDate) {
        const bookingTime = new Date(firstBookingDate).getTime()
        const now = new Date().setHours(0, 0, 0, 0)
        // 预约日期在今天或未来，可以取消
        if (bookingTime >= now) {
          return true
        }
        // 预约日期已过，不能取消
        return false
      }
    }

    // 其他订单类型或无法判断日期的
    return true
  }

  return false
}

async function payOrder(item: any) {
  try {
    await showConfirmDialog({
      title: '确认支付',
      message: `订单金额 ¥${item.pay_price}，将从余额扣除`
    })

    showLoadingToast({ message: '支付中...', forbidClick: true })

    const res: any = await apiPayOrder({
      uni: item.order_id,
      paytype: 'yue',
      from: 'h5'
    })

    closeToast()

    if (res.status === 200) {
      showToast('支付成功')
      onRefresh()
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('支付失败:', error)
    }
  }
}

async function cancelOrder(item: any) {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消该订单吗？'
    })

    const orderId = item.order_id
    console.log('取消订单, 订单号:', orderId)

    showLoadingToast({ message: '处理中...', forbidClick: true })

    const res: any = await apiCancelOrder(orderId)

    closeToast()

    if (res.status === 200) {
      showToast('订单已取消')
      onRefresh()
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('取消失败:', error)
      showToast(error.message || '取消失败')
    }
  }
}

// 申请退款/取消场地预约
async function refundOrder(item: any) {
  try {
    const orderType = item.type || item.product_type

    // 场地预约订单 (type=11) 使用专门的取消接口
    if (orderType === 11) {
      const timeCount = item.cartInfo?.length || 1
      await showConfirmDialog({
        title: '取消预约',
        message: `确定要取消该场地预约吗？\n共 ${timeCount} 个时段\n订单金额：¥${item.pay_price}\n取消后金额将退回余额`
      })

      showLoadingToast({ message: '查询预约记录...', forbidClick: true })

      // 先获取我的场地预约记录
      const recordsRes: any = await getMySpaceRecords({ page: 1, limit: 100 })
      console.log('场地记录响应:', recordsRes)

      if (recordsRes.status !== 200 || !recordsRes.data) {
        closeToast()
        showToast('获取预约记录失败')
        return
      }

      // 在场地记录中查找匹配的记录
      const records = recordsRes.data.list || recordsRes.data || []
      console.log('所有场地记录:', records)

      // 获取所有子订单 ID（合并订单可能有多个）
      const childOrderIds = item._childOrders || [item.order_id]
      console.log('子订单 IDs:', childOrderIds)

      // 方法1: 通过所有子订单的 order_id 匹配
      let matchedRecords = records.filter((record: any) => {
        return childOrderIds.includes(record.order_id)
      })

      console.log('通过 order_id 匹配的记录:', matchedRecords)

      // 方法2: 如果 order_id 没匹配到，尝试通过 oid 匹配
      if (matchedRecords.length === 0 && item.id) {
        matchedRecords = records.filter((record: any) => {
          return record.oid === item.id
        })
        console.log('通过 oid 匹配的记录:', matchedRecords)
      }

      // 方法3: 如果还没匹配到，尝试通过 cartInfo 的详细信息匹配
      if (matchedRecords.length === 0) {
        const cartInfo = item.cartInfo || []
        const orderBookings = cartInfo.map((c: any) => ({
          date: c.date,
          time_key: String(c.time_key),
          space_name: c.space_name,
          unique_key: c.unique_key
        }))
        console.log('订单预约信息:', orderBookings)

        matchedRecords = records.filter((record: any) => {
          return orderBookings.some((booking: any) =>
            record.date === booking.date &&
            String(record.time_key) === booking.time_key &&
            (record.space_name === booking.space_name || record.unique_key === booking.unique_key)
          )
        })
        console.log('通过 cartInfo 匹配的记录:', matchedRecords)
      }

      if (matchedRecords.length === 0) {
        closeToast()
        showToast('未找到可取消的预约记录，可能已取消或已过期')
        return
      }

      // 过滤出可取消的记录（status=1 表示已预约）
      const cancellableRecords = matchedRecords.filter((r: any) => r.status === 1)
      console.log('可取消的记录:', cancellableRecords)

      if (cancellableRecords.length === 0) {
        closeToast()
        showToast('该预约已取消或已使用')
        return
      }

      showLoadingToast({ message: '取消预约中...', forbidClick: true })

      // 逐个取消匹配的场地记录
      let successCount = 0
      let lastError = ''
      for (const record of cancellableRecords) {
        try {
          console.log('取消记录 ID:', record.id, '场地:', record.space_name, '时间:', record.start_time)
          const res: any = await apiCancelSpaceRecord(record.id)
          if (res.status === 200) {
            successCount++
          }
        } catch (err: any) {
          lastError = err.message || '取消失败'
          console.error('取消记录失败:', record.id, err)
        }
      }

      closeToast()

      if (successCount > 0) {
        showToast(`已取消 ${successCount} 个预约`)
        onRefresh()
      } else {
        showToast(lastError || '取消失败')
      }
    } else {
      // 其他类型订单使用退款接口
      await showConfirmDialog({
        title: '申请退款',
        message: `确定要申请退款吗？\n订单金额：¥${item.pay_price}`
      })

      const orderId = item.id
      console.log('申请退款, ID:', orderId)

      showLoadingToast({ message: '处理中...', forbidClick: true })

      const res: any = await apiRefundOrder(orderId, {
        text: '用户申请退款',
        refund_reason_wap_explain: '用户主动申请退款'
      })

      closeToast()

      if (res.status === 200) {
        showToast('退款申请已提交')
        onRefresh()
      }
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('操作失败:', error)
      showToast(error.message || '操作失败')
    }
  }
}

function onTabChange() {
  page.value = 1
  finished.value = false
  orders.value = []
  expandedOrders.value = new Set() // 切换 Tab 时重置展开状态
  loadOrders()
}

async function onRefresh() {
  page.value = 1
  finished.value = false
  orders.value = []
  await loadOrders()
  refreshing.value = false
}

async function loadMore() {
  await loadOrders()
}

// 获取订单的基础订单号（去掉 _1, _2 等后缀）
function getBaseOrderId(orderId: string): string {
  // 匹配 _数字 结尾的模式
  const match = orderId.match(/^(.+)_\d+$/)
  return match ? match[1] : orderId
}

// 合并拆分的子订单
function mergeOrders(list: any[]): any[] {
  const orderMap = new Map<string, any>()

  for (const item of list) {
    const baseOrderId = getBaseOrderId(item.order_id)

    if (orderMap.has(baseOrderId)) {
      // 已存在，合并信息
      const existing = orderMap.get(baseOrderId)

      // 合并 cartInfo
      if (item.cartInfo && item.cartInfo.length > 0) {
        existing.cartInfo = [...(existing.cartInfo || []), ...item.cartInfo]
      }

      // 累加价格
      existing.pay_price = (parseFloat(existing.pay_price || 0) + parseFloat(item.pay_price || 0)).toFixed(2)
      existing.total_price = (parseFloat(existing.total_price || 0) + parseFloat(item.total_price || 0)).toFixed(2)

      // 累加数量
      existing.total_num = (existing.total_num || 0) + (item.total_num || 0)

      // 保存所有子订单 ID（用于操作）
      existing._childOrders = existing._childOrders || [existing.order_id]
      existing._childOrders.push(item.order_id)

      // 使用最早的下单时间
      if (item.add_time < existing.add_time) {
        existing.add_time = item.add_time
        existing._add_time = item._add_time
      }
    } else {
      // 新订单，初始化
      const newItem = { ...item }
      newItem._baseOrderId = baseOrderId
      newItem._childOrders = [item.order_id]
      orderMap.set(baseOrderId, newItem)
    }
  }

  return Array.from(orderMap.values())
}

async function loadOrders() {
  if (finished.value) return

  loading.value = true
  try {
    const params: any = {
      page: page.value,
      limit: 50  // 获取更多数据以便客户端筛选
    }

    console.log('加载订单, 参数:', params)
    const res: any = await getOrderList(params)
    console.log('订单响应:', res)

    if (res.status === 200 && res.data) {
      let list = res.data.list || res.data || []

      // 合并拆分的子订单
      list = mergeOrders(list)

      // 客户端筛选
      const filterFn = tabFilterFns[activeTab.value]
      if (filterFn && activeTab.value !== 'all') {
        list = list.filter(filterFn)
      }

      // 排序
      list = sortOrders(list, activeTab.value)

      console.log('筛选排序后订单列表:', list.length, '条')

      if (page.value === 1) {
        orders.value = Array.isArray(list) ? list : []
      } else {
        orders.value.push(...(Array.isArray(list) ? list : []))
      }

      // 由于使用客户端筛选，简化分页逻辑
      finished.value = true
    } else {
      finished.value = true
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    finished.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 会自动触发 loadMore
})
</script>

<style scoped lang="scss">
.order-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.order-list {
  padding: 12px;

  .order-card {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.2s;

    &.expanded {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    // 折叠状态摘要（2行布局）
    .card-summary {
      padding: 12px 16px;
      cursor: pointer;

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;

        .booking-info {
          flex: 1;
          min-width: 0;
          font-size: 14px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          .space-name {
            font-weight: 500;
          }

          .separator {
            margin: 0 4px;
            color: #999;
          }

          .booking-time {
            color: #666;
          }
        }

        .status-price {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          .price {
            font-size: 15px;
            font-weight: 600;
            color: #ee0a24;
          }
        }
      }

      .expand-row {
        display: flex;
        justify-content: flex-end;
        padding-top: 4px;
      }
    }

    // 展开状态详情
    .card-detail {
      border-top: 1px solid #f5f5f5;
      padding: 16px;
      background: #fafafa;

      .detail-list {
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 6px 0;
          font-size: 13px;

          .label {
            color: #999;
            flex-shrink: 0;
            margin-right: 12px;
          }

          .value {
            color: #333;
            text-align: right;
            word-break: break-all;

            &.text-muted {
              color: #ccc;
            }
          }
        }
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #eee;
      }
    }
  }
}
</style>
