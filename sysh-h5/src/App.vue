<template>
  <router-view />
  <van-tabbar v-if="showTabbar" v-model="active" route>
    <van-tabbar-item replace to="/home" icon="home-o">场地</van-tabbar-item>
    <van-tabbar-item replace to="/order" icon="orders-o">订单</van-tabbar-item>
    <van-tabbar-item replace to="/user" icon="user-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

// 需要显示 tabbar 的页面
const tabbarPages = ['/home', '/order', '/user']

const showTabbar = computed(() => {
  return tabbarPages.some(path => route.path.startsWith(path))
})

watch(() => route.path, (path) => {
  const index = tabbarPages.findIndex(p => path.startsWith(p))
  if (index !== -1) {
    active.value = index
  }
}, { immediate: true })
</script>

<style>
:root {
  --van-tabbar-height: 50px;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  background-color: #f7f8fa;
}

#app {
  padding-bottom: 50px;
}
</style>
