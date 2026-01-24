# SYSH-H5

H5 移动端体育场馆预约平台，基于 Vue 3 + TypeScript + Vite 5 构建。

## 项目背景

本项目是基于现有微信小程序进行的 H5 移动端适配开发：

- **原版**: 微信小程序（体育场馆预约系统）
- **本项目**: H5 移动端版本，是小程序功能的简化定制版
- **共享后端**: 两个版本使用相同的后端 API 服务

### 与微信小程序的关系

| 对比项 | 微信小程序 | H5 版本 |
|--------|-----------|---------|
| 运行环境 | 微信客户端 | 任意浏览器 |
| 技术栈 | 原生小程序 | Vue 3 + Vant |
| 功能范围 | 完整功能 | 核心功能简化版 |
| 用户群体 | 微信用户 | 所有移动端用户 |

H5 版本参考了小程序的 API 调用方式和业务逻辑，但进行了以下调整：
- UI 组件从小程序原生组件迁移到 Vant 4
- 登录认证从微信授权改为手机号 + 短信验证码
- 移除了部分微信特有功能（如小程序分享、微信支付等）

## 功能特性

- 场馆预约：网球、羽毛球、篮球等场地在线预订
- 课程报名：体育培训课程浏览与报名
- 会员卡管理：储值卡、次卡查询与使用
- 订单管理：预约记录查询与管理
- 用户中心：个人信息、余额、预约历史

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: Vant 4
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **容器化**: Docker + Nginx

## 快速开始

### 本地开发

```bash
cd sysh-h5

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

### Docker 部署

```bash
cd sysh-h5

# 配置环境变量
cp .env.example .env
vim .env  # 设置 DOMAIN 和 CERT_DIR

# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 项目结构

```
sysh-h5/
├── src/
│   ├── api/          # API 接口
│   ├── pages/        # 页面组件
│   ├── stores/       # Pinia 状态管理
│   ├── components/   # 公共组件
│   ├── utils/        # 工具函数
│   └── router/       # 路由配置
├── server/           # Express 代理服务器
├── nginx/            # Nginx 配置
├── Dockerfile        # Docker 构建文件
└── docker-compose.yml
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DOMAIN` | 域名 | - |
| `CERT_DIR` | SSL 证书目录 | - |
| `TARGET_API` | 后端 API 地址 | https://sysh.tennis168.vip |

## License

[MIT](./LICENSE)
