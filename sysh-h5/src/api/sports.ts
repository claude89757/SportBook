import request from '@/utils/request'

// 获取教练/员工列表
export function getStaffList(params?: any) {
  return request.get('/sports/staff/list', { params })
}

// 获取预约课程列表
export function getAppointmentCourseList(params?: any) {
  return request.get('/sports/appointment_course/list', { params })
}

// 获取预约课程详情
export function getAppointmentCourseInfo(id: number | string) {
  return request.get('/sports/appointment_course/info/' + id)
}

// 预约课程
export function joinAppointmentCourse(data: any) {
  return request.post('/sports/appointment_course/join', data)
}

// 获取课程展示列表 (班课)
export function getClassShowList(params?: any) {
  return request.get('/sports/class_show/list', { params })
}

// 获取课程展示详情
export function getClassShowInfo(id: number | string) {
  return request.get('/sports/class_show/info/' + id)
}

// 加入班课
export function joinClass(data: any) {
  return request.post('/sports/class/join', data)
}

// 获取教练空间记录
export function getCoachSpaceRecords(params?: any) {
  return request.get('/sports/sub_coach/space_records', { params })
}

// 获取场地卡列表
export function getSpaceCardsList(params?: any) {
  return request.get('/space_cards/lst', { params })
}

// 获取场地卡详情
export function getSpaceCardDetail(id: number | string) {
  return request.get('/space_cards/details/' + id)
}

// 获取场地卡使用记录
export function getSpaceCardLogs(id: number | string, params?: any) {
  return request.get('/space_cards/logs/' + id, { params })
}

// 获取有效的场地卡
export function getValidSpaceCards(params?: any) {
  return request.get('/order/valid_space_cards', { params })
}

// 场地卡加入购物车
export function addSpaceCardToCart(data: any) {
  return request.post('/public_order/space_card/add_cart', data)
}

// 创建场地卡订单
export function createSpaceCardOrder(id: number | string, data: any) {
  return request.post('/public_order/space_card/create/' + id, data)
}

// ============ 场地预约相关 API ============

// 获取可预约天数设置
export function getSpaceDays(params?: any) {
  return request.get('/sports/get_space_days', { params })
}

// 获取场地按日期的时间段列表
export function getSpaceDateList(params: { date: string; store_id?: number }) {
  return request.get('/sports/space/date_list', { params })
}

// 场地加入购物车
export function spaceAddToCart(data: any) {
  return request.post('/cart/add', data)
}

// ============ 兼容旧接口名称 ============

// 获取运动分类（暂无此接口，返回空）
export function getSportsCategory() {
  return Promise.resolve({
    status: 200,
    data: []
  })
}

// 获取场地列表 - 使用真实的 space/date_list API
export function getCourtList(params?: any) {
  return getSpaceDateList(params)
}

// 获取场地详情
export function getCourtDetail(courtId: number | string) {
  return getStaffList({ id: courtId })
}

// 获取场地时段（与场地列表相同）
export function getCourtTime(params: any) {
  return getSpaceDateList(params)
}

// 预约场地
export function bookCourt(data: any) {
  return addSpaceCardToCart(data)
}

// 获取课程列表
export function getCourseList(params?: any) {
  return getClassShowList(params)
}

// 获取课程详情
export function getCourseDetail(courseId: number | string) {
  return getClassShowInfo(courseId)
}

// 获取课程排期
export function getCourseSchedule(params: any) {
  return getAppointmentCourseList(params)
}

// 预约课程
export function bookCourse(data: any) {
  return joinAppointmentCourse(data)
}

// 取消预约
export function cancelBook(data: any) {
  return request.post('/order/cancel', data)
}

// 获取教练列表
export function getCoachList(params?: any) {
  return getStaffList(params)
}

// 获取教练详情
export function getCoachDetail(coachId: number | string) {
  return getStaffList({ id: coachId })
}
