# SYSH H5 - 体育运动预约平台

微信小程序重构为 H5 移动端页面版本。

## 项目结构

```
sysh-h5/
├── server/                    # 后端代理服务
│   ├── index.js              # 代理入口
│   └── package.json
│
├── src/                       # 前端 Vue3 项目
│   ├── api/                  # API 接口
│   ├── components/           # 组件
│   ├── pages/                # 页面
│   ├── stores/               # Pinia 状态管理
│   ├── router/               # 路由配置
│   ├── utils/                # 工具函数
│   └── assets/               # 静态资源
│
├── vite.config.ts            # Vite 配置
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装代理服务器依赖
cd server && npm install && cd ..
```

### 2. 开发环境

```bash
# 启动开发服务器 (Vite 自带代理，无需启动 Node 服务)
npm run dev
```

访问 http://localhost:5173

### 3. 生产环境

```bash
# 构建前端
npm run build

# 启动代理服务器
npm run server
```

访问 http://localhost:3000

## 功能模块

- [x] 登录模块 - 手机验证码登录、滑块验证
- [x] 首页 - 门店选择、轮播图、功能入口
- [x] 运动预约 - 场地预约、课程预约
- [x] 卡项中心 - 卡项列表、卡项购买
- [x] 订单管理 - 订单列表、订单详情
- [x] 个人中心 - 用户信息、余额明细、我的卡项、我的预约

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Vant 4
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **构建工具**: Vite 5
- **代理服务器**: Express + http-proxy-middleware

## API 代理

由于浏览器跨域限制，所有 API 请求通过代理服务器转发：

```
H5 页面 -> /proxy/api/* -> 代理服务器 -> sysh.tennis168.vip/api/*
```

### 开发环境代理 (vite.config.ts)

```typescript
server: {
  proxy: {
    '/proxy': {
      target: 'https://sysh.tennis168.vip',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/proxy/, '')
    }
  }
}
```

### 生产环境代理 (server/index.js)

使用 Express + http-proxy-middleware 实现完整的代理功能。

## 验证代理

启动后访问以下地址验证代理是否正常：

- 开发环境: http://localhost:5173/proxy/api/agreement
- 生产环境: http://localhost:3000/proxy/api/agreement

## 注意事项

1. **API 依赖**: 此项目依赖第三方 API，API 可能随时变更或封禁
2. **跨域问题**: 必须通过代理服务器访问 API
3. **法律风险**: 反编译和使用他人 API 可能存在合规问题

## 部署建议

1. 使用 PM2 持久运行代理服务器
2. 配置 Nginx 反向代理 + HTTPS
3. 考虑添加访问限制和日志记录
