<template>
  <div class="balance-page">
    <van-nav-bar
      title="我的账户"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="balance-header">
      <div class="balance-label">当前余额(元)</div>
      <div class="balance-value">{{ userInfo?.now_money || '0.00' }}</div>
    </div>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="record-list">
          <div
            v-for="item in records"
            :key="item.id"
            class="record-item"
          >
            <div class="record-info">
              <div class="record-title">{{ item.title || item.mark }}</div>
              <div class="record-time">{{ item.create_time }}</div>
            </div>
            <div class="record-amount" :class="{ income: item.pm === 1 }">
              {{ item.pm === 1 ? '+' : '-' }}{{ item.number }}
            </div>
          </div>
        </div>

        <van-empty v-if="records.length === 0 && !loading" description="暂无记录" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getBalanceLog } from '@/api/order'

const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo)

const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const records = ref<any[]>([])

async function onRefresh() {
  page.value = 1
  finished.value = false
  records.value = []
  await loadRecords()
  refreshing.value = false
}

async function loadMore() {
  await loadRecords()
}

async function loadRecords() {
  if (finished.value) return

  loading.value = true
  try {
    const res: any = await getBalanceLog({
      page: page.value,
      limit: 20
    })

    if (res.status === 200 && res.data) {
      const list = res.data.list || res.data
      if (page.value === 1) {
        records.value = list
      } else {
        records.value.push(...list)
      }

      if (list.length < 20) {
        finished.value = true
      } else {
        page.value++
      }
    } else {
      // API returned but no data
      finished.value = true
    }
  } catch (error: any) {
    // Silently handle 404 - API may not be available
    if (error?.response?.status !== 404) {
      console.error('加载余额记录失败:', error)
    }
    finished.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  authStore.fetchUserInfo()
})
</script>

<style scoped lang="scss">
.balance-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.balance-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px 20px;
  text-align: center;
  color: #fff;

  .balance-label {
    font-size: 14px;
    opacity: 0.9;
  }

  .balance-value {
    font-size: 36px;
    font-weight: 500;
    margin-top: 8px;
  }
}

.record-list {
  padding: 12px;

  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 8px;

    .record-info {
      .record-title {
        font-size: 15px;
        color: #333;
      }

      .record-time {
        font-size: 13px;
        color: #999;
        margin-top: 4px;
      }
    }

    .record-amount {
      font-size: 16px;
      font-weight: 500;
      color: #ee0a24;

      &.income {
        color: #07c160;
      }
    }
  }
}
</style>
