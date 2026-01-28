import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/sports/CourtList.vue'),
    meta: { title: '场地预约', requiresAuth: false }
  },
  {
    path: '/store-select',
    name: 'StoreSelect',
    component: () => import('@/pages/home/StoreSelect.vue'),
    meta: { title: '选择门店', requiresAuth: false }
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('@/pages/order/Index.vue'),
    meta: { title: '订单', requiresAuth: true }
  },
  {
    path: '/order/confirm',
    name: 'OrderConfirm',
    component: () => import('@/pages/order/Confirm.vue'),
    meta: { title: '订单确认', requiresAuth: true }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('@/pages/order/Detail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/pages/user/Index.vue'),
    meta: { title: '我的', requiresAuth: true }
  },
  {
    path: '/user/balance',
    name: 'Balance',
    component: () => import('@/pages/user/Balance.vue'),
    meta: { title: '我的账户', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题（固定显示）
  document.title = 'SYSH场地预订青春版'

  // 检查登录状态
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // 需要登录但未登录，跳转到登录页
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
