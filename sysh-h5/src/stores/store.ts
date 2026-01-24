import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStoreList, setStore } from '@/api/store'

interface StoreInfo {
  id: number
  name: string
  store_name?: string
  address: string
  detailed_address?: string
  phone: string
  image: string
  latitude: string
  longitude: string
  [key: string]: any
}

export const useStoreStore = defineStore('store', () => {
  const storeList = ref<StoreInfo[]>([])
  const currentStoreId = ref<number | null>(
    localStorage.getItem('storeId') ? Number(localStorage.getItem('storeId')) : null
  )

  const currentStore = computed(() => {
    if (!currentStoreId.value) return null
    return storeList.value.find(s => s.id === currentStoreId.value) || null
  })

  // 获取门店列表
  async function fetchStoreList() {
    try {
      const res: any = await getStoreList()
      if (res.status === 200 && res.data) {
        // API 返回格式: { list: { list: [...], count: n }, tengxun_map_key: "" }
        let list = res.data
        if (res.data.list) {
          list = res.data.list.list || res.data.list
        }
        if (Array.isArray(list)) {
          // 统一字段名
          storeList.value = list.map((item: any) => ({
            ...item,
            store_name: item.store_name || item.name,
            address: item.address || item.detailed_address || ''
          }))
          return storeList.value
        }
      }
    } catch (error) {
      console.error('获取门店列表失败:', error)
    }
    return []
  }

  // 选择门店
  async function selectStore(storeId: number) {
    try {
      await setStore(storeId)
    } catch (error) {
      console.error('设置门店失败:', error)
    }
    // 无论 API 是否成功，都保存到本地
    currentStoreId.value = storeId
    localStorage.setItem('storeId', String(storeId))
    return true
  }

  // 清除门店选择
  function clearStore() {
    currentStoreId.value = null
    localStorage.removeItem('storeId')
  }

  return {
    storeList,
    currentStoreId,
    currentStore,
    fetchStoreList,
    selectStore,
    clearStore
  }
})
