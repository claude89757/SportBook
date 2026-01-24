<template>
  <div class="slider-verify">
    <div class="verify-header">
      <span>请完成安全验证</span>
      <van-icon name="cross" @click="$emit('close')" />
    </div>

    <div class="verify-content" v-if="captchaData">
      <div class="img-container" ref="imgContainer">
        <!-- 背景图 -->
        <img
          class="bg-img"
          :src="'data:image/png;base64,' + captchaData.originalImageBase64"
          @load="onBgLoad"
        />
        <!-- 滑块图 -->
        <img
          class="slider-img"
          :style="{ left: sliderLeft + 'px' }"
          :src="'data:image/png;base64,' + captchaData.jigsawImageBase64"
        />
      </div>

      <div class="slider-bar">
        <div class="slider-track" :style="{ width: sliderLeft + 'px' }"></div>
        <div
          class="slider-btn"
          :style="{ left: sliderLeft + 'px' }"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
          @mousedown="onMouseDown"
        >
          <van-icon name="arrow" />
        </div>
        <span class="slider-text" v-if="sliderLeft === 0">向右滑动完成验证</span>
      </div>

      <div class="verify-tip" :class="tipClass">{{ tipText }}</div>
    </div>

    <div class="verify-loading" v-else>
      <van-loading size="24px" vertical>加载中...</van-loading>
    </div>

    <div class="verify-refresh" @click="refresh">
      <van-icon name="replay" /> 刷新
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getAjcaptcha, ajcaptchaCheck } from '@/api/auth'
import CryptoJS from 'crypto-js'

const emit = defineEmits(['success', 'fail', 'close'])

interface CaptchaData {
  originalImageBase64: string
  jigsawImageBase64: string
  token: string
  secretKey: string
}

const captchaData = ref<CaptchaData | null>(null)
const imgContainer = ref<HTMLElement | null>(null)
const sliderLeft = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const maxLeft = ref(0)
const tipText = ref('')
const tipClass = ref('')
const imgWidth = ref(310)

// 生成或获取客户端 UID
function getClientUid(): string {
  let uid = localStorage.getItem('slider_uid')
  if (!uid) {
    uid = 'slider_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('slider_uid', uid)
  }
  return uid
}

// AES 加密函数
function aesEncrypt(data: string, secretKey: string): string {
  const key = CryptoJS.enc.Utf8.parse(secretKey)
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  })
  return encrypted.toString()
}

// 加载验证码
async function loadCaptcha() {
  captchaData.value = null
  sliderLeft.value = 0
  tipText.value = ''
  tipClass.value = ''

  try {
    const res: any = await getAjcaptcha('blockPuzzle')
    if (res.status === 200 && res.data) {
      captchaData.value = res.data
    }
  } catch (error) {
    console.error('加载验证码失败:', error)
    tipText.value = '加载失败，请刷新'
    tipClass.value = 'error'
  }
}

// 背景图加载完成
function onBgLoad(e: Event) {
  const img = e.target as HTMLImageElement
  imgWidth.value = img.width
  // 计算最大滑动距离
  maxLeft.value = img.width - 60 // 滑块宽度约60px
}

// 触摸开始
function onTouchStart(e: TouchEvent) {
  isDragging.value = true
  startX.value = e.touches[0].clientX - sliderLeft.value
}

// 触摸移动
function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  e.preventDefault()

  let x = e.touches[0].clientX - startX.value
  x = Math.max(0, Math.min(x, maxLeft.value))
  sliderLeft.value = x
}

// 触摸结束
async function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  await verify()
}

// 鼠标按下
function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  startX.value = e.clientX - sliderLeft.value

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 鼠标移动
function onMouseMove(e: MouseEvent) {
  if (!isDragging.value) return

  let x = e.clientX - startX.value
  x = Math.max(0, Math.min(x, maxLeft.value))
  sliderLeft.value = x
}

// 鼠标松开
async function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)

  if (!isDragging.value) return
  isDragging.value = false
  await verify()
}

// 验证滑块位置
async function verify() {
  if (!captchaData.value || sliderLeft.value < 10) {
    sliderLeft.value = 0
    return
  }

  try {
    // 计算滑动位置（与原小程序一致）
    const moveX = Math.round((sliderLeft.value / imgWidth.value) * 310)
    const pointData = { x: moveX, y: 5 }

    // 根据是否有 secretKey 决定是否加密
    let pointJson: string
    if (captchaData.value.secretKey) {
      pointJson = aesEncrypt(JSON.stringify(pointData), captchaData.value.secretKey)
    } else {
      pointJson = JSON.stringify(pointData)
    }

    // 构造验证凭证（用于登录接口）
    let captchaVerification: string
    if (captchaData.value.secretKey) {
      captchaVerification = aesEncrypt(
        captchaData.value.token + '---' + JSON.stringify(pointData),
        captchaData.value.secretKey
      )
    } else {
      captchaVerification = captchaData.value.token + '---' + JSON.stringify(pointData)
    }

    const res: any = await ajcaptchaCheck({
      captchaType: 'blockPuzzle',
      pointJson,
      token: captchaData.value.token
    })

    if (res.status === 200) {
      tipText.value = '验证成功'
      tipClass.value = 'success'

      // 返回验证结果
      emit('success', {
        captchaVerification,
        token: captchaData.value.token
      })
    } else {
      throw new Error(res.msg || '验证失败')
    }
  } catch (error: any) {
    tipText.value = error.message || '验证失败，请重试'
    tipClass.value = 'error'
    emit('fail', error)

    // 重置滑块
    setTimeout(() => {
      sliderLeft.value = 0
      loadCaptcha()
    }, 1000)
  }
}

// 刷新验证码
function refresh() {
  loadCaptcha()
}

onMounted(() => {
  loadCaptcha()
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

defineExpose({ refresh })
</script>

<style scoped lang="scss">
.slider-verify {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  width: 340px;
  max-width: 90vw;
}

.verify-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
}

.verify-content {
  .img-container {
    position: relative;
    width: 100%;
    height: auto;
    overflow: hidden;
    border-radius: 4px;

    .bg-img {
      width: 100%;
      display: block;
    }

    .slider-img {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: auto;
    }
  }

  .slider-bar {
    position: relative;
    height: 40px;
    background: #e8e8e8;
    border-radius: 20px;
    margin-top: 12px;

    .slider-track {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
    }

    .slider-btn {
      position: absolute;
      top: 0;
      left: 0;
      width: 40px;
      height: 40px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      touch-action: none;

      .van-icon {
        font-size: 18px;
        color: #667eea;
      }
    }

    .slider-text {
      position: absolute;
      width: 100%;
      text-align: center;
      line-height: 40px;
      font-size: 14px;
      color: #999;
      pointer-events: none;
    }
  }

  .verify-tip {
    text-align: center;
    font-size: 14px;
    margin-top: 8px;
    min-height: 20px;

    &.success {
      color: #07c160;
    }

    &.error {
      color: #ee0a24;
    }
  }
}

.verify-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.verify-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  color: #666;
  font-size: 14px;
  cursor: pointer;

  &:active {
    color: #333;
  }
}
</style>
