<template>
  <div class="card-detail-page">
    <van-nav-bar
      :title="card.name || '卡项详情'"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="card-header" :style="{ background: getCardBg(card.type) }">
      <div class="card-type">{{ card.type_name || '会员卡' }}</div>
      <div class="card-name">{{ card.name }}</div>
      <div class="card-price">
        <span class="price">¥{{ card.price || 0 }}</span>
        <span class="original" v-if="card.original_price">¥{{ card.original_price }}</span>
      </div>
    </div>

    <div class="card-info card">
      <div class="info-title">卡项权益</div>
      <div class="info-list">
        <div class="info-item" v-if="card.times">
          <van-icon name="gem-o" />
          <span>可使用 {{ card.times }} 次</span>
        </div>
        <div class="info-item" v-if="card.days">
          <van-icon name="clock-o" />
          <span>有效期 {{ card.days }} 天</span>
        </div>
        <div class="info-item" v-if="card.amount">
          <van-icon name="gold-coin-o" />
          <span>储值金额 ¥{{ card.amount }}</span>
        </div>
        <div class="info-item" v-if="card.discount">
          <van-icon name="discount" />
          <span>消费享 {{ card.discount }} 折优惠</span>
        </div>
      </div>
    </div>

    <div class="card-content card" v-if="card.content">
      <div class="info-title">卡项说明</div>
      <div class="content" v-html="card.content"></div>
    </div>

    <div class="bottom-bar">
      <van-button type="primary" block @click="buyCard">
        立即购买 ¥{{ card.price || 0 }}
      </van-button>
    </div>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import { getCardDetail, buyCard as apiBuyCard } from '@/api/order'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const cardId = computed(() => route.params.id as string)
const loading = ref(false)
const card = ref<any>({})

function getCardBg(type: string) {
  const colors: Record<string, string> = {
    times: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    stored: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    period: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
  return colors[type] || colors.times
}

async function buyCard() {
  if (!authStore.isLoggedIn) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  try {
    await showConfirmDialog({
      title: '确认购买',
      message: `您将购买 ${card.value.name}，价格 ¥${card.value.price}`
    })

    showLoadingToast({ message: '提交中...', forbidClick: true })

    const res: any = await apiBuyCard({
      card_id: cardId.value,
      pay_type: 'balance'
    })

    closeToast()

    if (res.status === 200) {
      showToast('购买成功')
      router.push('/user')
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('购买失败:', error)
    }
  }
}

async function loadCardDetail() {
  loading.value = true
  try {
    const res: any = await getCardDetail(cardId.value)
    if (res.status === 200 && res.data) {
      card.value = res.data
    }
  } catch (error) {
    console.error('加载卡项详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCardDetail()
})
</script>

<style scoped lang="scss">
.card-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 70px;
}

.card-header {
  padding: 30px 20px;
  color: #fff;

  .card-type {
    font-size: 13px;
    opacity: 0.9;
  }

  .card-name {
    font-size: 24px;
    font-weight: 500;
    margin-top: 8px;
  }

  .card-price {
    margin-top: 16px;

    .price {
      font-size: 32px;
      font-weight: 500;
    }

    .original {
      font-size: 16px;
      opacity: 0.7;
      text-decoration: line-through;
      margin-left: 8px;
    }
  }
}

.card {
  background: #fff;
  margin: 12px;
  padding: 16px;
  border-radius: 8px;
}

.info-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.info-list {
  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    font-size: 14px;
    color: #666;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .van-icon {
      font-size: 18px;
      color: #667eea;
    }
  }
}

.content {
  font-size: 14px;
  line-height: 1.6;
  color: #666;

  :deep(img) {
    max-width: 100%;
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
