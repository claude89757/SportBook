<template>
  <div class="court-detail-page">
    <van-nav-bar
      :title="court.name || '场地预约'"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 场地信息 -->
    <div class="court-header">
      <van-swipe :autoplay="3000" v-if="court.images?.length">
        <van-swipe-item v-for="(img, idx) in court.images" :key="idx">
          <img :src="img" class="court-img" />
        </van-swipe-item>
      </van-swipe>
      <img v-else-if="court.image" :src="court.image" class="court-img" />

      <div class="court-info">
        <div class="court-name">{{ court.name }}</div>
        <div class="court-desc">{{ court.desc }}</div>
        <div class="court-price">
          <span class="price">¥{{ court.price || 0 }}</span>
          <span class="unit">/小时</span>
        </div>
      </div>
    </div>

    <!-- 日期选择 -->
    <div class="section">
      <div class="section-title">选择日期</div>
      <div class="date-selector">
        <div
          v-for="item in dateList"
          :key="item.date"
          class="date-item"
          :class="{ active: item.date === selectedDate }"
          @click="selectDate(item.date)"
        >
          <div class="week">{{ item.week }}</div>
          <div class="day">{{ item.day }}</div>
        </div>
      </div>
    </div>

    <!-- 时段选择 -->
    <div class="section">
      <div class="section-title">选择时段</div>
      <div class="time-grid">
        <div
          v-for="item in timeSlots"
          :key="item.id"
          class="time-item"
          :class="{
            disabled: !item.available,
            selected: selectedTimes.includes(item.id)
          }"
          @click="toggleTime(item)"
        >
          <div class="time">{{ item.start_time }}-{{ item.end_time }}</div>
          <div class="status">
            {{ item.available ? `¥${item.price}` : '已约' }}
          </div>
        </div>
      </div>
      <van-empty v-if="timeSlots.length === 0 && !loading" description="暂无可预约时段" />
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <div class="summary">
        <div class="total-price">
          合计: <span class="price">¥{{ totalPrice }}</span>
        </div>
        <div class="selected-count">已选 {{ selectedTimes.length }} 个时段</div>
      </div>
      <van-button
        type="primary"
        :disabled="selectedTimes.length === 0"
        @click="submitBook"
      >
        立即预约
      </van-button>
    </div>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { getCourtDetail, getCourtTime, bookCourt } from '@/api/sports'

const router = useRouter()
const route = useRoute()

const courtId = computed(() => route.params.id as string)

const loading = ref(false)
const court = ref<any>({})
const timeSlots = ref<any[]>([])
const selectedDate = ref('')
const selectedTimes = ref<number[]>([])

// 生成日期列表
const dateList = computed(() => {
  const list = []
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    list.push({
      date: `${year}-${month}-${day}`,
      day: date.getDate(),
      week: i === 0 ? '今天' : i === 1 ? '明天' : weekDays[date.getDay()]
    })
  }
  return list
})

// 计算总价
const totalPrice = computed(() => {
  return timeSlots.value
    .filter(t => selectedTimes.value.includes(t.id))
    .reduce((sum, t) => sum + (t.price || 0), 0)
})

// 选择日期
function selectDate(date: string) {
  selectedDate.value = date
  selectedTimes.value = []
  loadTimeSlots()
}

// 切换时段选择
function toggleTime(item: any) {
  if (!item.available) return

  const idx = selectedTimes.value.indexOf(item.id)
  if (idx > -1) {
    selectedTimes.value.splice(idx, 1)
  } else {
    selectedTimes.value.push(item.id)
  }
}

// 提交预约
async function submitBook() {
  if (selectedTimes.value.length === 0) {
    showToast('请选择预约时段')
    return
  }

  try {
    await showConfirmDialog({
      title: '确认预约',
      message: `您将预约 ${selectedTimes.value.length} 个时段，合计 ¥${totalPrice.value}`
    })

    showLoadingToast({ message: '提交中...', forbidClick: true })

    const res: any = await bookCourt({
      court_id: courtId.value,
      date: selectedDate.value,
      time_ids: selectedTimes.value
    })

    closeToast()

    if (res.status === 200) {
      showToast('预约成功')
      router.push('/order')
    }
  } catch (error: any) {
    closeToast()
    if (error !== 'cancel') {
      console.error('预约失败:', error)
    }
  }
}

// 加载场地详情
async function loadCourtDetail() {
  try {
    const res: any = await getCourtDetail(courtId.value)
    if (res.status === 200 && res.data) {
      court.value = res.data
    }
  } catch (error) {
    console.error('加载场地详情失败:', error)
  }
}

// 加载时段
async function loadTimeSlots() {
  loading.value = true
  try {
    const res: any = await getCourtTime({
      court_id: courtId.value,
      date: selectedDate.value
    })
    if (res.status === 200 && res.data) {
      timeSlots.value = res.data
    }
  } catch (error) {
    console.error('加载时段失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 使用 query 中的日期或默认今天
  selectedDate.value = (route.query.date as string) || dateList.value[0].date
  loadCourtDetail()
  loadTimeSlots()
})
</script>

<style scoped lang="scss">
.court-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 70px;
}

.court-header {
  background: #fff;

  .court-img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .court-info {
    padding: 16px;

    .court-name {
      font-size: 18px;
      font-weight: 500;
    }

    .court-desc {
      font-size: 14px;
      color: #999;
      margin-top: 4px;
    }

    .court-price {
      margin-top: 8px;

      .price {
        font-size: 20px;
        font-weight: 500;
        color: #ee0a24;
      }

      .unit {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.section {
  background: #fff;
  margin-top: 12px;
  padding: 16px;

  .section-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
  }
}

.date-selector {
  display: flex;
  gap: 8px;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  .date-item {
    flex-shrink: 0;
    width: 52px;
    padding: 8px 0;
    text-align: center;
    border-radius: 8px;
    background: #f5f5f5;

    &.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    .week {
      font-size: 12px;
    }

    .day {
      font-size: 18px;
      font-weight: 500;
      margin-top: 4px;
    }
  }
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  .time-item {
    padding: 12px 8px;
    text-align: center;
    border: 1px solid #eee;
    border-radius: 8px;
    cursor: pointer;

    &.disabled {
      background: #f5f5f5;
      color: #ccc;
      cursor: not-allowed;
    }

    &.selected {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .time {
      font-size: 14px;
    }

    .status {
      font-size: 12px;
      margin-top: 4px;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .summary {
    .total-price {
      font-size: 14px;

      .price {
        font-size: 20px;
        font-weight: 500;
        color: #ee0a24;
      }
    }

    .selected-count {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }

  .van-button {
    width: 120px;
  }
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
