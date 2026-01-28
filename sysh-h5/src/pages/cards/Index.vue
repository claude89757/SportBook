<template>
  <div class="cards-page">
    <van-nav-bar title="卡项中心" />

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="card-list">
          <div
            v-for="item in cards"
            :key="item.id"
            class="card-item"
          >
            <div class="card-header" :style="{ background: getCardBg(item.type) }">
              <div class="card-type">{{ item.type_name || '会员卡' }}</div>
              <div class="card-name">{{ item.name }}</div>
            </div>

            <div class="card-body">
              <div class="card-info">
                <div class="info-item" v-if="item.times">
                  <span class="label">次数</span>
                  <span class="value">{{ item.times }}次</span>
                </div>
                <div class="info-item" v-if="item.days">
                  <span class="label">有效期</span>
                  <span class="value">{{ item.days }}天</span>
                </div>
                <div class="info-item" v-if="item.amount">
                  <span class="label">储值</span>
                  <span class="value">¥{{ item.amount }}</span>
                </div>
              </div>

              <div class="card-price">
                <span class="price">¥{{ item.price || 0 }}</span>
                <span class="original" v-if="item.original_price">
                  ¥{{ item.original_price }}
                </span>
              </div>

              <van-button size="small" type="primary" @click.stop="buyCard(item)">
                立即购买
              </van-button>
            </div>
          </div>
        </div>

        <van-empty v-if="cards.length === 0 && !loading" description="暂无卡项" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import { getCardList, buyCard as apiBuyCard } from '@/api/order'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const cards = ref<any[]>([])

// 卡片背景色
function getCardBg(type: string) {
  const colors: Record<string, string> = {
    times: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    stored: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    period: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  }
  return colors[type] || colors.times
}

// 购买卡项
async function buyCard(item: any) {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    await showConfirmDialog({
      title: '确认购买',
      message: `您将购买 ${item.name}，价格 ¥${item.price}`
    })

    showLoadingToast({ message: '提交中...', forbidClick: true })

    const res: any = await apiBuyCard({
      card_id: item.id,
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

// 下拉刷新
async function onRefresh() {
  page.value = 1
  finished.value = false
  cards.value = []
  await loadCards()
  refreshing.value = false
}

// 加载更多
async function loadMore() {
  await loadCards()
}

// 加载卡项列表
async function loadCards() {
  if (finished.value) return

  loading.value = true
  try {
    const res: any = await getCardList({
      page: page.value,
      limit: 10
    })

    if (res.status === 200 && res.data) {
      const list = res.data.list || res.data
      if (page.value === 1) {
        cards.value = list
      } else {
        cards.value.push(...list)
      }

      if (list.length < 10) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('加载卡项失败:', error)
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
.cards-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.card-list {
  padding: 12px;

  .card-item {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    .card-header {
      padding: 20px 16px;
      color: #fff;

      .card-type {
        font-size: 12px;
        opacity: 0.9;
      }

      .card-name {
        font-size: 20px;
        font-weight: 500;
        margin-top: 4px;
      }
    }

    .card-body {
      padding: 16px;

      .card-info {
        display: flex;
        gap: 24px;
        margin-bottom: 12px;

        .info-item {
          .label {
            font-size: 12px;
            color: #999;
          }

          .value {
            display: block;
            font-size: 15px;
            font-weight: 500;
            margin-top: 2px;
          }
        }
      }

      .card-price {
        display: inline-flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 12px;

        .price {
          font-size: 24px;
          font-weight: 500;
          color: #ee0a24;
        }

        .original {
          font-size: 14px;
          color: #999;
          text-decoration: line-through;
        }
      }

      .van-button {
        float: right;
      }
    }
  }
}
</style>
