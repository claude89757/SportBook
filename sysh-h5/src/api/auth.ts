import request from '@/utils/request'

// 获取滑块验证图片
export function getAjcaptcha(captchaType = 'blockPuzzle') {
  return request.get('/ajcaptcha', {
    params: { captchaType }
  })
}

// 验证滑块
export function ajcaptchaCheck(data: {
  captchaType: string
  pointJson: string
  token: string
}) {
  return request.post('/ajcheck', data)
}

// 获取验证码 key
export function getVerifyCode() {
  return request.get('/verify_code')
}

// 发送短信验证码
export function registerVerify(data: {
  phone: string
  type: string
  key: string
  code: string
  captchaType?: string
  captchaVerification?: string
}) {
  return request.post('/register/verify', data)
}

// 手机号登录
export function loginMobile(data: {
  phone: string
  captcha: string
  spread_spid?: number
}) {
  return request.post('/login/mobile', data)
}

// 账号密码登录
export function loginPassword(data: {
  account: string
  password: string
}) {
  return request.post('/login', data)
}

// 获取用户信息
export function getUserInfo() {
  return request.get('/user')
}

// 退出登录
export function logout() {
  return request.get('/logout')
}

// 获取用户协议
export function getAgreement(key = 'h5_agree_rule') {
  return request.get('/agreement', {
    params: { key }
  })
}

// 编辑用户信息
export function editUser(data: {
  nickname?: string
  avatar?: string
  [key: string]: any
}) {
  return request.post('/user/edit', data)
}
