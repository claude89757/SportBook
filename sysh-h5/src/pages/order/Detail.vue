<template>
  <div class="order-detail-page">
    <van-nav-bar
      title="订单详情"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 订单状态 -->
    <div class="status-bar" :class="statusClass">
      <van-icon :name="statusIcon" size="24" />
      <span>{{ order.status_name || getStatusText(order.paid, order.is_del) }}</span>
    </div>

    <!-- 订单信息 -->
    <div class="order-info card">
      <div class="info-header">
        <div class="info-content">
          <div class="order-name">{{ order.project_title || '未知商品' }}</div>
          <div class="order-desc-list">
            <div class="desc-item" v-if="order.store_name">
              <span class="label">购卡门店：</span>{{ order.store_name }}
            </div>
            <div class="desc-item" v-if="order.card_type == 1">
              <span class="label">卡金额：</span>¥{{ order.project_price }}
            </div>
            <div class="desc-item" v-if="order.card_type == 1 && order.paid == 1">
              <span class="label">剩余金额：</span>¥{{ order.balance_price }}
            </div>
            <div class="desc-item" v-if="order.card_type == 2">
              <span class="label">小时数：</span>{{ order.times }}H
            </div>
            <div class="desc-item" v-if="order.card_type == 2 && order.paid == 1">
              <span class="label">剩余：</span>{{ order.balance_times }}H
            </div>
            <div class="desc-item" v-if="order.paid == 1 && order.expiry_date">
              <span class="label">有效期：</span>{{ order.expiry_date }}
            </div>
            <div class="desc-item" v-else-if="order.valid_days">
              <span class="label">有效期：</span>{{ order.valid_days }}天
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单详情 -->
    <div class="order-detail card">
      <van-cell-group :border="false">
        <van-cell title="订单编号" :value="order.order_id" />
        <van-cell title="下单时间" :value="order.add_time" />
        <van-cell title="支付方式" :value="order.pay_type_name || '余额支付'" v-if="order.paid == 1" />
        <van-cell title="支付时间" :value="order.pay_time" v-if="order.pay_time" />
      </van-cell-group>
    </div>

    <!-- 金额信息 -->
    <div class="price-info card">
      <div class="price-item">
        <span>订单金额</span>
        <span>¥{{ order.project_price || 0 }}</span>
      </div>
      <div class="price-item" v-if="order.refund_price > 0">
        <span>退款金额</span>
        <span class="refund">¥{{ order.refund_price }}</span>
      </div>
      <div class="price-item total">
        <span>实付金额</span>
        <span class="price">¥{{ order.pay_price || 0 }}</span>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-bar" v-if="order.paid == 0 && order.is_del == 0">
      <van-button plain @click="cancelOrder">取消订单</van-button>
      <van-button type="primary" @click="payOrder">立即支付</van-button>
    </div>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import { getOrderDetail, cancelOrder as apiCancelOrder, payOrder as apiPayOrder } from '@/api/order'

const router = useRouter()
const route = useRoute()

const orderId = computed(() => route.params.id as string)
const loading = ref(false)
const order = ref<any>({})

const statusClass = computed(() => {
  if (order.value.is_del === 1) return 'default'
  if (order.value.paid === 0) return 'warning'
  if (order.value.paid === 1) return 'success'
  return 'default'
})

const statusIcon = computed(() => {
  if (order.value.is_del === 1) return 'close'
  if (order.value.paid === 0) return 'clock-o'
  if (order.value.paid === 1) return 'checked'
  return 'info-o'
})

function getStatusText(paid: number, is_del: number) {
  if (is_del === 1) return '已删除'
  if (paid === 0) return '待付款'
  if (paid === 1) return '已支付'
  return '未知'
}

async function payOrder() {
  try {
    await showConfirmDialog({
      title: '确认支付',
      message: `订单金额 ¥${order.value.pay_price}，将从余额扣除`
    })

    showLoadingToast({ message: '支付中...', forbidClick: true })

    const res: any = await apiPayOrder({
      uni: order.value.order_id,
      paytype: 'yue',
      from: 'h5'
    })

    closeToast()

    if (res.status === 200) {
      showToast('支付成功')
      loadOrderDetail()
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('支付失败:', error)
    }
  }
}

async function cancelOrder() {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消该订单吗？'
    })

    showLoadingToast({ message: '处理中...', forbidClick: true })

    const res: any = await apiCancelOrder(orderId.value)

    closeToast()

    if (res.status === 200) {
      showToast('订单已取消')
      loadOrderDetail()
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('取消失败:', error)
    }
  }
}

async function loadOrderDetail() {
  loading.value = true
  try {
    const res: any = await getOrderDetail(orderId.value)
    if (res.status === 200 && res.data) {
      order.value = res.data
    }
  } catch (error) {
    console.error('加载订单详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped lang="scss">
.order-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 70px;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: #fff;

  &.warning {
    background: linear-gradient(135deg, #ff976a 0%, #f56c6c 100%);
  }

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.success {
    background: linear-gradient(135deg, #67c23a 0%, #5cb85c 100%);
  }

  &.default {
    background: #999;
  }

  span {
    font-size: 18px;
    font-weight: 500;
  }
}

.card {
  background: #fff;
  margin: 12px;
  border-radius: 8px;
  overflow: hidden;
}

.order-info {
  padding: 16px;

  .info-header {
    .info-content {
      .order-name {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 8px;
      }

      .order-desc-list {
        .desc-item {
          font-size: 13px;
          color: #666;
          line-height: 1.8;

          .label {
            color: #999;
          }
        }
      }
    }
  }
}

.price-info {
  padding: 16px;

  .price-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;

    .refund {
      color: #ee0a24;
    }

    &.total {
      border-top: 1px solid #f5f5f5;
      margin-top: 8px;
      padding-top: 16px;
      font-weight: 500;

      .price {
        font-size: 18px;
        color: #ee0a24;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .van-button {
    flex: 1;
  }
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
