<template>
  <div class="course-detail-page">
    <van-nav-bar
      :title="course.name || '课程详情'"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 课程图片 -->
    <div class="course-header">
      <img :src="course.image" class="course-img" v-if="course.image" />
      <div class="course-img placeholder" v-else>
        <van-icon name="photo-o" size="48" />
      </div>
    </div>

    <!-- 课程信息 -->
    <div class="course-info card">
      <div class="course-name">{{ course.name }}</div>
      <div class="course-tags">
        <van-tag plain type="primary" v-if="course.coach_name">
          {{ course.coach_name }}
        </van-tag>
        <van-tag plain v-if="course.duration">{{ course.duration }}分钟</van-tag>
        <van-tag plain type="success" v-if="course.level">{{ course.level }}</van-tag>
      </div>
      <div class="course-price">
        <span class="price">¥{{ course.price || 0 }}</span>
        <span class="original" v-if="course.original_price">
          ¥{{ course.original_price }}
        </span>
        <span class="sales">{{ course.sales || 0 }}人已报名</span>
      </div>
    </div>

    <!-- 课程排期 -->
    <div class="schedule-section card">
      <div class="section-title">课程排期</div>

      <!-- 日期选择 -->
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

      <!-- 排期列表 -->
      <div class="schedule-list">
        <div
          v-for="item in schedules"
          :key="item.id"
          class="schedule-item"
          :class="{
            disabled: !item.available || item.quota <= 0,
            selected: selectedSchedule?.id === item.id
          }"
          @click="selectSchedule(item)"
        >
          <div class="schedule-time">{{ item.start_time }} - {{ item.end_time }}</div>
          <div class="schedule-info">
            <span v-if="item.coach_name">{{ item.coach_name }}</span>
            <span>剩余 {{ item.quota || 0 }} 名额</span>
          </div>
          <van-icon v-if="selectedSchedule?.id === item.id" name="success" class="check" />
        </div>

        <van-empty v-if="schedules.length === 0 && !loading" description="暂无排期" />
      </div>
    </div>

    <!-- 课程介绍 -->
    <div class="intro-section card" v-if="course.content">
      <div class="section-title">课程介绍</div>
      <div class="intro-content" v-html="course.content"></div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-bar">
      <van-button
        type="primary"
        block
        :disabled="!selectedSchedule"
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
import { getCourseDetail, getCourseSchedule, bookCourse } from '@/api/sports'

const router = useRouter()
const route = useRoute()

const courseId = computed(() => route.params.id as string)

const loading = ref(false)
const course = ref<any>({})
const schedules = ref<any[]>([])
const selectedDate = ref('')
const selectedSchedule = ref<any>(null)

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

// 选择日期
function selectDate(date: string) {
  selectedDate.value = date
  selectedSchedule.value = null
  loadSchedules()
}

// 选择排期
function selectSchedule(item: any) {
  if (!item.available || item.quota <= 0) return
  selectedSchedule.value = item
}

// 提交预约
async function submitBook() {
  if (!selectedSchedule.value) {
    showToast('请选择排期')
    return
  }

  try {
    await showConfirmDialog({
      title: '确认预约',
      message: `您将预约 ${selectedSchedule.value.start_time}-${selectedSchedule.value.end_time} 的课程`
    })

    showLoadingToast({ message: '提交中...', forbidClick: true })

    const res: any = await bookCourse({
      schedule_id: selectedSchedule.value.id
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

// 加载课程详情
async function loadCourseDetail() {
  try {
    const res: any = await getCourseDetail(courseId.value)
    if (res.status === 200 && res.data) {
      course.value = res.data
    }
  } catch (error) {
    console.error('加载课程详情失败:', error)
  }
}

// 加载排期
async function loadSchedules() {
  loading.value = true
  try {
    const res: any = await getCourseSchedule({
      course_id: courseId.value,
      date: selectedDate.value
    })
    if (res.status === 200 && res.data) {
      schedules.value = res.data
    }
  } catch (error) {
    console.error('加载排期失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  selectedDate.value = dateList.value[0].date
  loadCourseDetail()
  loadSchedules()
})
</script>

<style scoped lang="scss">
.course-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 70px;
}

.course-header {
  .course-img {
    width: 100%;
    height: 220px;
    object-fit: cover;

    &.placeholder {
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ccc;
    }
  }
}

.card {
  background: #fff;
  margin: 12px;
  padding: 16px;
  border-radius: 8px;
}

.course-info {
  margin-top: -20px;
  position: relative;
  z-index: 1;

  .course-name {
    font-size: 18px;
    font-weight: 500;
  }

  .course-tags {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .course-price {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 12px;

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

    .sales {
      margin-left: auto;
      font-size: 13px;
      color: #999;
    }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.date-selector {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 12px;

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

.schedule-list {
  .schedule-item {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 8px;

    &.disabled {
      background: #f5f5f5;
      color: #ccc;
    }

    &.selected {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .schedule-time {
      font-size: 15px;
      font-weight: 500;
    }

    .schedule-info {
      flex: 1;
      margin-left: 12px;
      font-size: 13px;
      color: #999;

      span + span {
        margin-left: 8px;
      }
    }

    .check {
      color: #667eea;
      font-size: 18px;
    }
  }
}

.intro-content {
  font-size: 14px;
  line-height: 1.6;
  color: #666;

  :deep(img) {
    max-width: 100%;
    height: auto;
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
