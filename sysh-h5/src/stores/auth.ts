import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo, logout } from '@/api/auth'

interface UserInfo {
  uid: number
  nickname: string
  avatar: string
  phone: string
  now_money: string | number
  integral: string | number
  [key: string]: any
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  // 设置 token
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // 清除 token
  function clearToken() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 获取用户信息
  async function fetchUserInfo() {
    if (!token.value) return null

    try {
      const res: any = await getUserInfo()
      if (res.status === 200 && res.data) {
        userInfo.value = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        return res.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
    return null
  }

  // 登出
  async function doLogout() {
    try {
      await logout()
    } catch (error) {
      console.error('登出请求失败:', error)
    }
    clearToken()
  }

  // 初始化 - 从 localStorage 恢复用户信息
  function init() {
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }

  init()

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    clearToken,
    fetchUserInfo,
    doLogout
  }
})
