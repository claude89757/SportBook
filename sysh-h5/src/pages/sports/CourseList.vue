<template>
  <div class="course-list-page">
    <van-nav-bar
      :title="title"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 筛选 -->
    <van-dropdown-menu v-if="categories.length > 0">
      <van-dropdown-item v-model="filterCategory" :options="categoryOptions" />
    </van-dropdown-menu>

    <!-- 课程列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="listLoading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <div class="course-list">
          <div
            v-for="item in courses"
            :key="item.id"
            class="course-item"
          >
            <img :src="item.image" class="course-image" v-if="item.image" />
            <div class="course-image placeholder" v-else>
              <van-icon name="photo-o" />
            </div>

            <div class="course-info">
              <div class="course-name">{{ item.name }}</div>
              <div class="course-tags">
                <van-tag plain type="primary" v-if="item.coach_name">
                  {{ item.coach_name }}
                </van-tag>
                <van-tag plain v-if="item.duration">{{ item.duration }}分钟</van-tag>
              </div>
              <div class="course-bottom">
                <div class="course-price">
                  <span class="price">¥{{ item.price || 0 }}</span>
                  <span class="original" v-if="item.original_price">
                    ¥{{ item.original_price }}
                  </span>
                </div>
                <div class="course-sales">{{ item.sales || 0 }}人已报名</div>
              </div>
            </div>
          </div>
        </div>

        <van-empty v-if="courses.length === 0 && !listLoading" description="暂无课程" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCourseList, getSportsCategory } from '@/api/sports'

const route = useRoute()

const title = computed(() => (route.query.name as string) || '课程列表')
const categoryId = computed(() => route.query.category_id as string)

const refreshing = ref(false)
const listLoading = ref(false)
const finished = ref(false)
const page = ref(1)
const limit = 10

const courses = ref<any[]>([])
const categories = ref<any[]>([])
const filterCategory = ref('')

const categoryOptions = computed(() => {
  return [
    { text: '全部分类', value: '' },
    ...categories.value.map(c => ({ text: c.name, value: c.id }))
  ]
})

// 下拉刷新
async function onRefresh() {
  page.value = 1
  finished.value = false
  courses.value = []
  await loadCourses()
  refreshing.value = false
}

// 加载更多
async function loadMore() {
  await loadCourses()
}

// 加载课程列表
async function loadCourses() {
  if (finished.value) return

  listLoading.value = true
  try {
    const res: any = await getCourseList({
      category_id: filterCategory.value || categoryId.value,
      page: page.value,
      limit
    })

    if (res.status === 200 && res.data) {
      const list = res.data.list || res.data
      if (page.value === 1) {
        courses.value = list
      } else {
        courses.value.push(...list)
      }

      if (list.length < limit) {
        finished.value = true
      } else {
        page.value++
      }
    }
  } catch (error) {
    console.error('加载课程失败:', error)
    finished.value = true
  } finally {
    listLoading.value = false
  }
}

// 加载分类
async function loadCategories() {
  try {
    const res: any = await getSportsCategory()
    if (res.status === 200 && res.data) {
      categories.value = res.data
    }
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 监听筛选变化
watch(filterCategory, () => {
  page.value = 1
  finished.value = false
  courses.value = []
  loadCourses()
})

onMounted(() => {
  loadCategories()
  if (categoryId.value) {
    filterCategory.value = categoryId.value
  }
})
</script>

<style scoped lang="scss">
.course-list-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.course-list {
  padding: 12px;

  .course-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 12px;

    .course-image {
      width: 120px;
      height: 90px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;

      &.placeholder {
        background: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #ccc;
      }
    }

    .course-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .course-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .course-tags {
        display: flex;
        gap: 6px;
        margin-top: 8px;

        .van-tag {
          font-size: 11px;
        }
      }

      .course-bottom {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: auto;

        .course-price {
          .price {
            font-size: 18px;
            font-weight: 500;
            color: #ee0a24;
          }

          .original {
            font-size: 12px;
            color: #999;
            text-decoration: line-through;
            margin-left: 4px;
          }
        }

        .course-sales {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}
</style>
