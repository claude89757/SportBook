<template>
  <div class="login-page">
    <div class="login-header">
      <h1>欢迎登录</h1>
      <p>体育运动预约平台</p>
    </div>

    <div class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
        <van-field
          v-model="captcha"
          type="number"
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="!!countdown"
              @click="sendCode"
            >
              {{ countdown ? `${countdown}s后重发` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
      </van-cell-group>

      <div class="login-agreement">
        <van-checkbox v-model="agreed" icon-size="16px">
          我已阅读并同意
          <span class="link" @click.stop="showAgreement">《用户协议》</span>
        </van-checkbox>
      </div>

      <van-button
        class="login-btn"
        type="primary"
        block
        :loading="loading"
        :disabled="!canLogin"
        @click="doLogin"
      >
        登录
      </van-button>
    </div>

    <!-- 滑块验证弹窗 -->
    <van-popup
      v-model:show="showSlider"
      round
      :close-on-click-overlay="false"
      class="slider-popup"
    >
      <SliderVerify
        v-if="showSlider"
        @success="onSliderSuccess"
        @fail="onSliderFail"
        @close="showSlider = false"
      />
    </van-popup>

    <!-- 用户协议弹窗 -->
    <van-popup
      v-model:show="showAgreementPopup"
      position="bottom"
      :style="{ height: '80%' }"
      round
    >
      <div class="agreement-content">
        <div class="agreement-header">
          <span>用户协议</span>
          <van-icon name="cross" @click="showAgreementPopup = false" />
        </div>
        <div class="agreement-body" v-html="agreementContent"></div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import SliderVerify from '@/components/SliderVerify/Index.vue'
import { getVerifyCode, registerVerify, loginMobile, getAgreement } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const phone = ref('')
const captcha = ref('')
const agreed = ref(false)
const loading = ref(false)
const countdown = ref(0)

const showSlider = ref(false)
const showAgreementPopup = ref(false)
const agreementContent = ref('')

// 验证码相关
const verifyKey = ref('')
const captchaVerification = ref('')

const canLogin = computed(() => {
  return phone.value.length === 11 && captcha.value.length >= 4 && agreed.value
})

// 显示协议
async function showAgreement() {
  if (!agreementContent.value) {
    try {
      const res: any = await getAgreement()
      if (res.status === 200 && res.data) {
        agreementContent.value = res.data.content || res.data
      }
    } catch (error) {
      console.error('获取协议失败:', error)
    }
  }
  showAgreementPopup.value = true
}

// 发送验证码
async function sendCode() {
  if (!phone.value || phone.value.length !== 11) {
    showToast('请输入正确的手机号')
    return
  }

  // 先获取 verifyKey
  try {
    const keyRes: any = await getVerifyCode()
    if (keyRes.status === 200 && keyRes.data) {
      verifyKey.value = keyRes.data.key
    }
  } catch (error) {
    console.error('获取验证码key失败:', error)
  }

  // 显示滑块验证
  showSlider.value = true
}

// 滑块验证成功
async function onSliderSuccess(data: { captchaVerification: string; token: string }) {
  showSlider.value = false
  captchaVerification.value = data.captchaVerification

  // 发送短信验证码
  showLoadingToast({ message: '发送中...', forbidClick: true })

  try {
    const res: any = await registerVerify({
      phone: phone.value,
      type: 'login',
      key: verifyKey.value,
      code: '',
      captchaType: 'blockPuzzle',
      captchaVerification: data.captchaVerification
    })

    closeToast()

    if (res.status === 200) {
      showToast('验证码已发送')
      startCountdown()
    } else {
      showToast(res.msg || '发送失败')
    }
  } catch (error: any) {
    closeToast()
    showToast(error.message || '发送失败')
  }
}

// 滑块验证失败
function onSliderFail(error: any) {
  console.error('滑块验证失败:', error)
}

// 开始倒计时
function startCountdown() {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 登录
async function doLogin() {
  if (!canLogin.value) return

  loading.value = true

  try {
    const res: any = await loginMobile({
      phone: phone.value,
      captcha: captcha.value
    })

    if (res.status === 200 && res.data) {
      // 保存 token
      const token = res.data.token || res.data
      authStore.setToken(token)

      // 获取用户信息
      await authStore.fetchUserInfo()

      showToast('登录成功')

      // 跳转（验证 redirect 参数有效性）
      const redirect = route.query.redirect as string
      const isValidRedirect = redirect && redirect.startsWith('/') && !redirect.includes('undefined')
      router.replace(isValidRedirect ? redirect : '/home')
    }
  } catch (error: any) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 50%, #f7f8fa 50%);
  padding-top: 80px;
}

.login-header {
  text-align: center;
  color: #fff;
  margin-bottom: 40px;

  h1 {
    font-size: 28px;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    margin: 0;
    opacity: 0.9;
  }
}

.login-form {
  margin: 0 20px;

  :deep(.van-cell-group--inset) {
    margin: 0;
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.van-field__button) {
    padding-left: 8px;
  }
}

.login-agreement {
  margin: 20px 0;
  padding: 0 4px;

  :deep(.van-checkbox__label) {
    font-size: 13px;
    color: #666;
  }

  .link {
    color: #667eea;
  }
}

.login-btn {
  margin-top: 20px;
  border-radius: 8px;
  height: 44px;
  font-size: 16px;
}

.slider-popup {
  padding: 0;
}

.agreement-content {
  height: 100%;
  display: flex;
  flex-direction: column;

  .agreement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;
    font-size: 16px;
    font-weight: 500;
  }

  .agreement-body {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
  }
}
</style>
