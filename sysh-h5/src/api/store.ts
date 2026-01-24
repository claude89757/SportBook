import request from '@/utils/request'

// 获取门店列表
export function getStoreList() {
  return request.get('/store_list')
}

// 设置当前门店
export function setStore(storeId: number | string) {
  return request.post('/set_store', { store_id: storeId })
}

// 获取门店详情
export function getStoreDetail(storeId: number | string) {
  return request.get('/store/detail/' + storeId)
}

// 获取首页数据 (包含 banner, menus, roll 等)
export function getIndexData() {
  return request.get('/index')
}

// 获取 v2 首页数据
export function getIndexV2() {
  return request.get('/v2/index')
}

// 获取通用信息
export function getCommonInfo(params?: any) {
  return request.get('/getCommonInfo', { params })
}

// 获取导航菜单
export function getNavigation(params?: any) {
  return request.get('/navigation', { params })
}
