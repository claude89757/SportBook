<template>
  <div class="order-confirm-page">
    <van-nav-bar
      title="订单确认"
      left-arrow
      @click-left="$router.back()"
    />

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>

    <template v-else-if="orderInfo">
      <!-- 订单商品信息 -->
      <div class="order-card">
        <div class="card-header">
          <van-icon name="shop-o" />
          <span>{{ orderInfo.storeName || '预约详情' }}</span>
        </div>
        <div class="product-list">
          <div
            v-for="(item, index) in orderInfo.cartInfo || []"
            :key="index"
            class="product-item"
          >
            <div class="product-info">
              <div class="product-name">{{ item.productInfo?.store_name || item.name || '场地预约' }}</div>
              <div class="product-desc">{{ item.productInfo?.attrInfo?.suk || item.time || '' }}</div>
              <div class="product-date" v-if="item.date">{{ item.date }}</div>
            </div>
            <div class="product-price">
              <span class="price">¥{{ item.truePrice || item.price || 0 }}</span>
              <span class="num">x{{ item.cart_num || 1 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 订单备注 -->
      <div class="order-card">
        <van-field
          v-model="mark"
          label="备注"
          placeholder="选填，请输入备注信息"
          type="textarea"
          rows="2"
          autosize
        />
      </div>

      <!-- 支付方式 -->
      <div class="order-card">
        <div class="card-header">支付方式</div>
        <van-cell-group :border="false">
          <van-cell>
            <template #title>
              <div class="pay-item">
                <van-icon name="balance-o" color="#ff976a" size="24" />
                <span>余额支付</span>
                <span class="balance">(可用 ¥{{ userBalance }})</span>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 价格明细 -->
      <div class="order-card price-detail">
        <div class="price-row">
          <span>商品总价</span>
          <span>¥{{ orderInfo.priceGroup?.sumPrice || 0 }}</span>
        </div>
        <div class="price-row" v-if="parseFloat(orderInfo.priceGroup?.couponPrice || 0) > 0">
          <span>优惠</span>
          <span class="discount">-¥{{ orderInfo.priceGroup?.couponPrice }}</span>
        </div>
        <div class="price-row total">
          <span>实付金额</span>
          <span class="final-price">¥{{ orderInfo.priceGroup?.truePrice || orderInfo.priceGroup?.totalPrice || 0 }}</span>
        </div>
      </div>
    </template>

    <van-empty v-else-if="!loading" description="订单信息加载失败" />

    <!-- 底部提交栏 -->
    <div class="bottom-bar" v-if="orderInfo">
      <div class="total-info">
        <span>合计：</span>
        <span class="total-price">¥{{ orderInfo.priceGroup?.truePrice || orderInfo.priceGroup?.totalPrice || 0 }}</span>
      </div>
      <van-button
        type="primary"
        class="submit-btn"
        :loading="submitting"
        @click="submitOrder"
      >
        立即支付
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { orderConfirm, createOrder } from '@/api/order'
import { useStoreStore } from '@/stores/store'

const router = useRouter()
const route = useRoute()
const storeStore = useStoreStore()

const loading = ref(true)
const submitting = ref(false)
const orderInfo = ref<any>(null)
const orderKey = ref('')  // 用于创建订单
const mark = ref('')
const payType = ref('yue')  // 仅支持余额支付
const userBalance = ref('0.00')

// 获取订单确认信息
async function loadOrderInfo() {
  const cartId = route.query.cartId as string
  if (!cartId) {
    showToast('订单参数错误')
    router.back()
    return
  }

  loading.value = true
  try {
    const res: any = await orderConfirm({
      cartId: cartId,
      new: 1,
      store_id: storeStore.currentStoreId || undefined
    })

    if (res.status === 200 && res.data) {
      orderInfo.value = res.data
      orderKey.value = res.data.orderKey || ''
      userBalance.value = res.data.userInfo?.now_money || '0.00'
    } else {
      showToast(res.msg || '获取订单信息失败')
    }
  } catch (error: any) {
    console.error('加载订单信息失败:', error)
    showToast(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 提交订单
async function submitOrder() {
  if (!orderInfo.value || !orderKey.value) {
    showToast('订单信息错误')
    return
  }

  // 检查余额
  const balance = parseFloat(userBalance.value) || 0
  const payPrice = parseFloat(orderInfo.value.priceGroup?.truePrice || orderInfo.value.totalPrice) || 0
  if (balance < payPrice) {
    showToast('余额不足')
    return
  }

  submitting.value = true
  try {
    const res: any = await createOrder(orderKey.value, {
      payType: 'yue',
      mark: mark.value,
      from: 'h5'
    })

    if (res.status === 200) {
      showToast('支付成功')
      router.replace('/order')
    } else {
      showToast(res.msg || '下单失败')
    }
  } catch (error: any) {
    console.error('提交订单失败:', error)
    showToast(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadOrderInfo()
})
</script>

<style scoped lang="scss">
.order-confirm-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 130px; // 适配底部操作栏 + tabbar
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.order-card {
  margin: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #333;
  }
}

.product-list {
  .product-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .product-info {
      flex: 1;

      .product-name {
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
      }

      .product-desc,
      .product-date {
        font-size: 12px;
        color: #999;
        margin-top: 2px;
      }
    }

    .product-price {
      text-align: right;

      .price {
        font-size: 14px;
        color: #333;
        display: block;
      }

      .num {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.pay-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .balance {
    color: #999;
    font-size: 12px;
  }
}

.price-detail {
  .price-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    color: #666;

    .discount {
      color: #ee0a24;
    }

    &.total {
      padding-top: 12px;
      border-top: 1px solid #f5f5f5;
      font-weight: 500;
      color: #333;

      .final-price {
        color: #ee0a24;
        font-size: 18px;
      }
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 50px; // 在 tabbar 上方
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .total-info {
    font-size: 14px;
    color: #333;

    .total-price {
      font-size: 20px;
      font-weight: 500;
      color: #ee0a24;
    }
  }

  .submit-btn {
    width: 120px;
    border-radius: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
  }
}
</style>
