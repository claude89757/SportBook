<template>
  <div class="store-select-page">
    <van-nav-bar title="选择门店" left-arrow @click-left="$router.back()" />

    <van-search
      v-model="keyword"
      placeholder="搜索门店"
      show-action
      @search="onSearch"
    >
      <template #action>
        <div @click="onSearch">搜索</div>
      </template>
    </van-search>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <div class="store-list">
        <div
          v-for="item in filteredStores"
          :key="item.id"
          class="store-item"
          :class="{ active: item.id === currentStoreId }"
          @click="selectStore(item)"
        >
          <img :src="item.image" class="store-image" v-if="item.image" />
          <div class="store-image placeholder" v-else>
            <van-icon name="shop-o" />
          </div>

          <div class="store-info">
            <div class="store-name">{{ item.name || item.store_name }}</div>
            <div class="store-address">
              <van-icon name="location-o" />
              {{ item.detailed_address || item.address || '暂无地址' }}
            </div>
            <div class="store-phone" v-if="item.phone">
              <van-icon name="phone-o" />
              {{ item.phone }}
            </div>
          </div>

          <van-icon
            v-if="item.id === currentStoreId"
            name="success"
            class="check-icon"
          />
        </div>

        <van-empty v-if="filteredStores.length === 0 && !loading" description="暂无门店" />
      </div>
    </van-pull-refresh>

    <van-loading v-if="loading" class="page-loading">加载中...</van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useStoreStore } from '@/stores/store'

const router = useRouter()
const storeStore = useStoreStore()

const keyword = ref('')
const loading = ref(false)
const refreshing = ref(false)

const currentStoreId = computed(() => storeStore.currentStoreId)

const filteredStores = computed(() => {
  if (!keyword.value) {
    return storeStore.storeList
  }
  return storeStore.storeList.filter(
    s => (s.name || s.store_name || '').includes(keyword.value) ||
         (s.detailed_address || s.address || '').includes(keyword.value)
  )
})

// 搜索
function onSearch() {
  // 已通过 computed 实现过滤
}

// 下拉刷新
async function onRefresh() {
  await loadStores()
  refreshing.value = false
}

// 选择门店
async function selectStore(item: any) {
  await storeStore.selectStore(item.id)
  showToast('已切换到 ' + (item.name || item.store_name))
  router.back()
}

// 加载门店列表
async function loadStores() {
  loading.value = true
  try {
    await storeStore.fetchStoreList()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (storeStore.storeList.length === 0) {
    loadStores()
  }
})
</script>

<style scoped lang="scss">
.store-select-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.store-list {
  padding: 12px;
}

.store-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  position: relative;

  &.active {
    border: 2px solid #667eea;
  }

  .store-image {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;

    &.placeholder {
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      color: #ccc;
    }
  }

  .store-info {
    flex: 1;
    min-width: 0;

    .store-name {
      font-size: 16px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .store-address,
    .store-phone {
      font-size: 13px;
      color: #999;
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;

      .van-icon {
        font-size: 14px;
      }
    }
  }

  .check-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 20px;
    color: #667eea;
  }
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
