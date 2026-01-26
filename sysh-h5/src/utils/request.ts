import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { showToast, showLoadingToast, closeToast } from 'vant'

// 直连后端 API（后端已配置 CORS，无需代理）
const API_BASE_URL = 'https://sysh.tennis168.vip/api'

// 创建 axios 实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 设置 Form-type 为 h5
    config.headers['Form-type'] = 'h5'

    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authori-zation'] = `Bearer ${token}`
    }

    // 添加门店 ID
    const storeId = localStorage.getItem('storeId')
    if (storeId) {
      config.headers['store-id'] = storeId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { status, data, msg, message } = response.data

    // 成功状态
    if (status === 200) {
      return response.data
    }

    // 登录过期状态码
    const expiredCodes = [410000, 410001, 410002]
    if (expiredCodes.includes(status)) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      showToast('登录已过期，请重新登录')
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return Promise.reject(new Error('登录已过期'))
    }

    // 其他错误
    const errorMsg = msg || message || '请求失败'
    showToast(errorMsg)
    return Promise.reject(new Error(errorMsg))
  },
  (error) => {
    console.error('Request error:', error)
    const message = error.response?.data?.msg || error.message || '网络请求失败'
    showToast(message)
    return Promise.reject(error)
  }
)

// 封装带 loading 的请求
export async function requestWithLoading<T = any>(
  config: AxiosRequestConfig,
  loadingText = '加载中...'
): Promise<T> {
  showLoadingToast({
    message: loadingText,
    forbidClick: true,
    duration: 0
  })
  try {
    const res = await request(config)
    return res as T
  } finally {
    closeToast()
  }
}

export default request
