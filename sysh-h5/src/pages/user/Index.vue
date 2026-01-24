<template>
  <div class="user-page">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info" v-if="isLoggedIn">
        <img :src="userInfo?.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <div class="nickname">{{ userInfo?.nickname || '用户' }}</div>
          <div class="phone">{{ userInfo?.phone }}</div>
        </div>
      </div>
      <div class="user-info" v-else @click="goLogin">
        <img :src="defaultAvatar" class="avatar" />
        <div class="info">
          <div class="nickname">点击登录</div>
          <div class="phone">登录后享受更多服务</div>
        </div>
      </div>
    </div>

    <!-- 资产信息 -->
    <div class="asset-card" v-if="isLoggedIn">
      <div class="asset-item" @click="$router.push('/user/balance')">
        <div class="value">{{ userInfo?.now_money || '0.00' }}</div>
        <div class="label">余额</div>
      </div>
      <div class="divider"></div>
      <div class="asset-item">
        <div class="value">{{ userInfo?.integral || 0 }}</div>
        <div class="label">积分</div>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-card">
      <van-cell-group :border="false">
        <van-cell
          title="我的账户"
          icon="gold-coin-o"
          is-link
          @click="$router.push('/user/balance')"
        />
        <van-cell
          title="我的订单"
          icon="orders-o"
          is-link
          @click="$router.push('/order')"
        />
      </van-cell-group>
    </div>

    <div class="menu-card">
      <van-cell-group :border="false">
        <van-cell
          title="当前门店"
          icon="shop-o"
          :value="currentStore?.store_name || '未选择'"
          is-link
          @click="$router.push('/store-select')"
        />
      </van-cell-group>
    </div>

    <!-- 退出登录 -->
    <div class="logout-btn" v-if="isLoggedIn">
      <van-button plain block @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useAuthStore } from '@/stores/auth'
import { useStoreStore } from '@/stores/store'

const router = useRouter()
const authStore = useAuthStore()
const storeStore = useStoreStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const isLoggedIn = computed(() => authStore.isLoggedIn)
const userInfo = computed(() => authStore.userInfo)
const currentStore = computed(() => storeStore.currentStore)

function goLogin() {
  router.push('/login')
}

async function handleLogout() {
  try {
    await showConfirmDialog({
      title: '确认退出',
      message: '确定要退出登录吗？'
    })
    await authStore.doLogout()
    showToast('已退出登录')
    router.replace('/home')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('退出登录失败:', error)
    }
  }
}

onMounted(() => {
  if (isLoggedIn.value) {
    authStore.fetchUserInfo()
  }
  if (storeStore.storeList.length === 0) {
    storeStore.fetchStoreList()
  }
})
</script>

<style scoped lang="scss">
.user-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 60px;
}

.user-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px 60px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .info {
    color: #fff;

    .nickname {
      font-size: 18px;
      font-weight: 500;
    }

    .phone {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
    }
  }
}

.asset-card {
  display: flex;
  background: #fff;
  margin: -30px 16px 0;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;

  .asset-item {
    flex: 1;
    text-align: center;

    .value {
      font-size: 20px;
      font-weight: 500;
      color: #333;
    }

    .label {
      font-size: 13px;
      color: #999;
      margin-top: 4px;
    }
  }

  .divider {
    width: 1px;
    background: #eee;
    margin: 0 10px;
  }
}

.menu-card {
  margin: 12px 16px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;

  :deep(.van-cell__left-icon) {
    font-size: 20px;
    color: #667eea;
  }
}

.logout-btn {
  margin: 24px 16px;

  .van-button {
    color: #ee0a24;
    border-color: #ee0a24;
  }
}
</style>
