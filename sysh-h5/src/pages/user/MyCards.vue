<template>
  <div class="my-cards-page">
    <van-nav-bar
      title="我的卡项"
      left-arrow
      @click-left="$router.back()"
    />

    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="使用中" name="active" />
      <van-tab title="已过期" name="expired" />
    </van-tabs>

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
            :class="{ expired: activeTab === 'expired' }"
          >
            <div class="card-header">
              <div class="card-name">{{ item.card_name || item.name }}</div>
              <van-tag v-if="activeTab === 'expired'" type="default">已过期</van-tag>
            </div>

            <div class="card-info">
              <div class="info-item" v-if="item.remain_times !== undefined">
                <span class="label">剩余次数</span>
                <span class="value">{{ item.remain_times }}次</span>
              </div>
              <div class="info-item" v-if="item.remain_money !== undefined">
                <span class="label">剩余金额</span>
                <span class="value">¥{{ item.remain_money }}</span>
              </div>
              <div class="info-item">
                <span class="label">有效期至</span>
                <span class="value">{{ item.end_time || item.expire_time }}</span>
              </div>
            </div>

            <div class="card-footer">
              <span class="buy-time">购买时间: {{ item.create_time }}</span>
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
import { getMyCards } from '@/api/order'

const activeTab = ref('active')
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const cards = ref<any[]>([])

const statusMap: Record<string, number> = {
  active: 1,
  expired: 2
}

function onTabChange() {
  page.value = 1
  finished.value = false
  cards.value = []
  loadCards()
}

async function onRefresh() {
  page.value = 1
  finished.value = false
  cards.value = []
  await loadCards()
  refreshing.value = false
}

async function loadMore() {
  await loadCards()
}

async function loadCards() {
  if (finished.value) return

  loading.value = true
  try {
    const res: any = await getMyCards({
      status: statusMap[activeTab.value],
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
.my-cards-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.card-list {
  padding: 12px;

  .card-item {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 12px;
    color: #fff;

    &.expired {
      background: linear-gradient(135deg, #999 0%, #666 100%);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .card-name {
        font-size: 18px;
        font-weight: 500;
      }
    }

    .card-info {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;

      .info-item {
        .label {
          font-size: 12px;
          opacity: 0.8;
        }

        .value {
          display: block;
          font-size: 16px;
          font-weight: 500;
          margin-top: 4px;
        }
      }
    }

    .card-footer {
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);

      .buy-time {
        font-size: 12px;
        opacity: 0.8;
      }
    }
  }
}
</style>
