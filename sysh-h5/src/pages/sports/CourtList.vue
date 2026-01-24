<template>
  <div class="court-list-page">
    <!-- 头部门店选择 -->
    <div class="home-header">
      <div class="store-selector" @click="goToStoreSelect">
        <van-icon name="location-o" />
        <span class="store-name">{{ currentStore?.name || currentStore?.store_name || '选择门店' }}</span>
        <van-icon name="arrow-down" />
      </div>
      <div class="header-title">场地预约</div>
    </div>

    <!-- 日期选择 -->
    <div class="date-selector">
      <div
        v-for="(item, index) in dateList"
        :key="item.date"
        class="date-item"
        :class="{ active: index === currentDateIndex, disabled: index >= advanceBookingDays }"
        @click="selectDate(index)"
      >
        <div class="week">{{ item.week }}</div>
        <div class="day">{{ item.day }}</div>
      </div>
    </div>

    <!-- 场地时段列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="space-grid" v-if="timeSlots.length > 0">
        <!-- 头部：场地名称列表 -->
        <div class="grid-header">
          <div class="time-cell header-cell">时间</div>
          <div
            v-for="space in spaceList"
            :key="space.space_id"
            class="space-cell header-cell"
          >
            {{ space.name }}
          </div>
        </div>

        <!-- 时段行 -->
        <div
          v-for="slot in timeSlots"
          :key="slot.timeKey"
          class="grid-row"
        >
          <div class="time-cell">{{ slot.time }}</div>
          <div
            v-for="space in slot.children"
            :key="space.space_id"
            class="space-cell"
            :class="getSpaceClass(space)"
            @click="toggleSpace(slot, space)"
          >
            <template v-if="space.active === '1'">
              <span class="price" v-if="!space.checked">¥{{ space.price }}</span>
              <van-icon v-else name="success" class="check-icon" />
            </template>
            <template v-else>
              <span class="status-text">{{ space.status_text || '不可约' }}</span>
            </template>
          </div>
        </div>
      </div>

      <van-empty v-if="timeSlots.length === 0 && !loading" description="暂无场地" />
    </van-pull-refresh>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <div class="selected-info">
        <template v-if="selectedSpaces.length > 0">
          <span>已选 {{ selectedSpaces.length }} 个时段</span>
          <span class="total">¥{{ totalPrice }}</span>
        </template>
        <template v-else-if="!isBookingAllowed">
          <span class="disabled-hint">该日期暂不支持预订</span>
        </template>
        <template v-else>
          <span class="hint">请选择预约时段</span>
        </template>
      </div>
      <van-button
        type="primary"
        class="submit-btn"
        :disabled="selectedSpaces.length === 0 || !isBookingAllowed"
        @click="submitOrder"
      >
        确认预约
      </van-button>
    </div>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getSpaceDays, getSpaceDateList, spaceAddToCart } from '@/api/sports'
import { useStoreStore } from '@/stores/store'

const router = useRouter()
const route = useRoute()
const storeStore = useStoreStore()

const currentStore = computed(() => storeStore.currentStore)

const loading = ref(false)
const refreshing = ref(false)
const timeSlots = ref<any[]>([])
const spaceList = ref<any[]>([])
const currentDateIndex = ref(0)
const advanceBookingDays = ref(7)

// 当前日期是否可预订
const isBookingAllowed = computed(() => {
  return currentDateIndex.value < advanceBookingDays.value
})

// 选中的场地
const selectedSpaces = ref<any[]>([])

// 生成日期列表
const dateList = computed(() => {
  const list = []
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (let i = 0; i < 15; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    list.push({
      date: dateStr,
      day: date.getDate(),
      week: i === 0 ? '今天' : i === 1 ? '明天' : weekDays[date.getDay()]
    })
  }

  return list
})

// 当前选择的日期
const selectedDate = computed(() => dateList.value[currentDateIndex.value]?.date || '')

// 计算总价
const totalPrice = computed(() => {
  return selectedSpaces.value.reduce((sum, item) => sum + parseFloat(item.price || 0), 0).toFixed(2)
})

// 跳转门店选择
function goToStoreSelect() {
  router.push('/store-select')
}

// 选择日期
function selectDate(index: number) {
  currentDateIndex.value = index
  selectedSpaces.value = []
  loadCourts()
  // 不可预订日期显示提示
  if (index >= advanceBookingDays.value) {
    showToast(`该日期暂不支持预订，最多提前${advanceBookingDays.value}天预约`)
  }
}

// 获取场地状态样式
function getSpaceClass(space: any) {
  if (space.checked) return 'selected'
  if (space.active !== '1') return 'disabled'
  return 'available'
}

// 切换场地选中状态
function toggleSpace(slot: any, space: any) {
  if (space.active !== '1') return
  // 检查是否可预订
  if (!isBookingAllowed.value) {
    showToast('该日期暂不支持预订')
    return
  }

  const index = selectedSpaces.value.findIndex(
    s => s.space_id === space.space_id && s.timeKey === slot.timeKey
  )

  if (index > -1) {
    selectedSpaces.value.splice(index, 1)
    space.checked = false
  } else {
    // 格式化日期为 minidate (MM-DD)
    const dateParts = selectedDate.value.split('-')
    const minidate = `${dateParts[1]}-${dateParts[2]}`

    selectedSpaces.value.push({
      space_id: space.space_id,
      spaceId: space.space_id,
      name: space.name,
      space_name: space.name,
      price: space.price,
      timeKey: slot.timeKey,
      time: slot.time,
      full_time: slot.time,
      date: selectedDate.value,
      minidate: minidate,
      specType: space.spec_type || '',
      id: `${slot.timeKey}_${space.space_id}`
    })
    space.checked = true
  }
}

// 提交订单
async function submitOrder() {
  if (selectedSpaces.value.length === 0) {
    showToast('请先选择场地')
    return
  }

  // 检查是否登录
  const token = localStorage.getItem('token')
  if (!token) {
    showToast('请先登录')
    router.push({
      path: '/login',
      query: { redirect: '/home' }
    })
    return
  }

  try {
    const res: any = await spaceAddToCart({
      cartNum: 1,
      new: 1,
      store_id: storeStore.currentStoreId,
      order_type: 11,
      items: selectedSpaces.value.map(s => ({
        space_id: s.space_id,
        spaceId: s.spaceId,
        price: s.price,
        timeKey: s.timeKey,
        specType: s.specType,
        time: s.time,
        full_time: s.full_time,
        name: s.name,
        date: s.date,
        minidate: s.minidate,
        id: s.id,
        space_name: s.space_name
      }))
    })

    if (res.status === 200) {
      const cartIds = res.data?.cartId || []
      router.push({
        path: '/order/confirm',
        query: {
          cartId: cartIds.join(','),
          fromType: 'space'
        }
      })
    } else {
      showToast(res.msg || '加入购物车失败')
    }
  } catch (error: any) {
    showToast(error.message || '操作失败')
  }
}

// 下拉刷新
async function onRefresh() {
  await loadCourts()
  refreshing.value = false
}

// 加载场地配置
async function loadSpaceConfig() {
  const storeId = storeStore.currentStoreId
  if (!storeId) return

  try {
    const res: any = await getSpaceDays({
      store_id: storeId
    })
    if (res.status === 200 && res.data) {
      advanceBookingDays.value = res.data.advance_booking_days || 7
    }
  } catch (error) {
    console.error('加载场地配置失败:', error)
  }
}

// 加载场地列表
async function loadCourts() {
  // 确保有门店 ID
  const storeId = storeStore.currentStoreId
  if (!storeId) {
    showToast('请先选择门店')
    router.push('/store-select')
    return
  }

  loading.value = true
  try {
    const res: any = await getSpaceDateList({
      date: selectedDate.value,
      store_id: storeId
    })

    if (res.status === 200 && res.data) {
      const data = res.data
      timeSlots.value = data.children || []

      // 提取场地列表（从第一个时段获取）
      if (timeSlots.value.length > 0 && timeSlots.value[0].children) {
        spaceList.value = timeSlots.value[0].children.map((s: any) => ({
          space_id: s.space_id,
          name: s.name
        }))
      }
    }
  } catch (error) {
    console.error('加载场地失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // 如果没有选择门店，先获取门店列表并自动选择第一个
  if (!storeStore.currentStoreId) {
    await storeStore.fetchStoreList()
    if (storeStore.storeList.length > 0) {
      await storeStore.selectStore(storeStore.storeList[0].id)
    }
  }
  await loadSpaceConfig()
  await loadCourts()
})
</script>

<style scoped lang="scss">
.court-list-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 130px; // 适配 tabbar(50px) + 底部操作栏(80px)
}

.home-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
  padding-top: calc(16px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.store-selector {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #fff;
  font-size: 15px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;

  .store-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.header-title {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.date-selector {
  display: flex;
  background: #fff;
  padding: 12px;
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

    &.disabled {
      opacity: 0.5;
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

.space-grid {
  margin: 12px;
  background: #fff;
  border-radius: 8px;
  overflow-x: auto;

  .grid-header {
    display: flex;
    background: #f7f8fa;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .grid-row {
    display: flex;
    border-top: 1px solid #eee;
  }

  .time-cell {
    flex-shrink: 0;
    width: 80px;
    padding: 12px 8px;
    font-size: 12px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
  }

  .header-cell {
    font-weight: 500;
    color: #333;
  }

  .space-cell {
    flex-shrink: 0;
    width: 80px;
    padding: 12px 8px;
    font-size: 12px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid #eee;
    cursor: pointer;
    transition: all 0.2s;

    &.available {
      color: #667eea;

      &:active {
        background: #f0f0ff;
      }
    }

    &.selected {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    &.disabled {
      color: #ccc;
      cursor: not-allowed;
    }

    .price {
      font-size: 13px;
    }

    .status-text {
      font-size: 11px;
    }

    .check-icon {
      font-size: 18px;
    }
  }
}

.bottom-bar {
  position: fixed;
  bottom: 50px; // 在 tabbar 之上
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .selected-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 14px;
    color: #666;

    .total {
      font-size: 18px;
      font-weight: 500;
      color: #ee0a24;
    }

    .disabled-hint, .hint {
      color: #999;
      font-size: 14px;
    }
  }

  .submit-btn {
    width: 120px;
    border-radius: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;

    &:disabled {
      background: #ccc !important;
      opacity: 0.7;
    }
  }
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
