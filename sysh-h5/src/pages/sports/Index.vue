<template>
  <div class="sports-page">
    <van-nav-bar title="运动" />

    <!-- 分类标签 -->
    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="场地预约" name="court">
        <div class="tab-content">
          <div class="entry-list">
            <div
              v-for="item in categories"
              :key="item.id"
              class="entry-item"
              @click="goToCourt(item)"
            >
              <img :src="item.image || item.icon" class="entry-icon" />
              <div class="entry-info">
                <div class="entry-name">{{ item.name }}</div>
                <div class="entry-desc">{{ item.desc || '场地预约' }}</div>
              </div>
              <van-icon name="arrow" />
            </div>
          </div>
          <van-empty v-if="categories.length === 0" description="暂无运动项目" />
        </div>
      </van-tab>

    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSportsCategory } from '@/api/sports'

const router = useRouter()

const activeTab = ref('court')
const categories = ref<any[]>([])

// 跳转场地列表
function goToCourt(item: any) {
  router.push({
    path: '/sports/court',
    query: { category_id: item.id, name: item.name }
  })
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

onMounted(() => {
  loadCategories()
})
</script>

<style scoped lang="scss">
.sports-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.tab-content {
  padding: 12px;
}

.entry-list {
  .entry-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 12px;

    .entry-icon {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
    }

    .entry-info {
      flex: 1;

      .entry-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }

      .entry-desc {
        font-size: 13px;
        color: #999;
        margin-top: 4px;
      }
    }

    .van-icon {
      color: #ccc;
    }
  }
}
</style>
