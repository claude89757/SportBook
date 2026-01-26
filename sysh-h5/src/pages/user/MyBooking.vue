<template>
  <div class="my-booking-page">
    <van-nav-bar
      title="我的预约"
      left-arrow
      @click-left="$router.back()"
    />

    <van-tabs v-model:active="activeTab" sticky @change="onTabChange">
      <van-tab title="全部" name="all" />
      <van-tab title="待使用" name="pending" />
      <van-tab title="已完成" name="completed" />
      <van-tab title="已取消" name="cancelled" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="booking-list">
          <div
            v-for="item in bookings"
            :key="item.id"
            class="booking-item"
          >
            <div class="booking-header">
              <span class="booking-type">
                {{ item.type === 'court' ? '场地预约' : '课程预约' }}
              </span>
              <van-tag :type="getStatusType(item.status)">
                {{ item.status_name || getStatusText(item.status) }}
              </van-tag>
            </div>

            <div class="booking-content">
              <div class="booking-name">{{ item.name || item.title }}</div>
              <div class="booking-info">
                <van-icon name="clock-o" />
                {{ formatDateWithWeekday(item.date) }} {{ item.time_str }}
              </div>
              <div class="booking-info" v-if="item.store_name">
                <van-icon name="location-o" />
                {{ item.store_name }}
              </div>
            </div>

            <div class="booking-footer" v-if="item.status === 1">
              <van-button
                size="small"
                plain
                type="danger"
                @click="cancelBooking(item)"
              >
                取消预约
              </van-button>
            </div>
          </div>
        </div>

        <van-empty v-if="bookings.length === 0 && !loading" description="暂无预约" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import { getBookingList } from '@/api/order'
import { cancelBook } from '@/api/sports'
import { formatDateWithWeekday } from '@/utils/date'

const activeTab = ref('all')
const refreshing = ref(false)
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const bookings = ref<any[]>([])

const statusMap: Record<string, number | undefined> = {
  all: undefined,
  pending: 1,
  completed: 2,
  cancelled: -1
}

function getStatusType(status: number) {
  const types: Record<number, string> = {
    1: 'primary',
    2: 'success',
    '-1': 'default'
  }
  return types[status] || 'default'
}

function getStatusText(status: number) {
  const texts: Record<number, string> = {
    1: '待使用',
    2: '已完成',
    '-1': '已取消'
  }
  return texts[status] || '未知'
}

async function cancelBooking(item: any) {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消该预约吗？'
    })

    showLoadingToast({ message: '处理中...', forbidClick: true })

    const res: any = await cancelBook({
      order_id: item.id,
      type: item.type
    })

    closeToast()

    if (res.status === 200) {
      showToast('已取消预约')
      onRefresh()
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('取消失败:', error)
    }
  }
}

function onTabChange() {
  page.value = 1
  finished.value = false
  bookings.value = []
  loadBookings()
}

async function onRefresh() {
  page.value = 1
  finished.value = false
  bookings.value = []
  await loadBookings()
  refreshing.value = false
}

async function loadMore() {
  await loadBookings()
}

async function loadBookings() {
  if (finished.value) return

  loading.value = true
  try {
    const res: any = await getBookingList({
      status: statusMap[activeTab.value],
      page: page.value,
      limit: 10
    })

    if (res.status === 200 && res.data) {
      const list = res.data.list || res.data
      if (page.value === 1) {
        bookings.value = list
      } else {
        bookings.value.push(...list)
      }

      if (list.length < 10) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('加载预约失败:', error)
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
.my-booking-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.booking-list {
  padding: 12px;

  .booking-item {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;

    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .booking-type {
        font-size: 13px;
        color: #999;
      }
    }

    .booking-content {
      .booking-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      .booking-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: #666;
        margin-top: 8px;

        .van-icon {
          font-size: 14px;
          color: #999;
        }
      }
    }

    .booking-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f5f5f5;
      text-align: right;
    }
  }
}
</style>
