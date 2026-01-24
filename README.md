# SportBook

开源的体育场馆预约系统 H5 移动端，支持私有化部署。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## 简介

SportBook 是一个轻量级的体育场馆预约系统，提供场地预订、课程报名、会员管理等核心功能。项目基于 Vue 3 + TypeScript 构建，支持 Docker 一键部署，适合中小型体育场馆快速搭建自己的预约平台。

### 项目来源

本项目 H5 版本改编自同名微信小程序：

| 版本 | 技术栈 | 运行环境 | 功能范围 |
|------|--------|----------|----------|
| 微信小程序 | 原生小程序 | 微信客户端 | 完整功能 |
| **H5 版本** | Vue 3 + Vant 4 | 任意浏览器 | 核心功能 |

两个版本共享同一套后端 API，H5 版本进行了以下适配：
- 登录方式：微信授权 → 手机号 + 短信验证码
- UI 组件：小程序原生 → Vant 4 移动端组件库
- 部署方式：微信平台托管 → Docker 自主部署

## 功能特性

- **场地预约** - 网球、羽毛球、篮球等场地在线预订
- **课程报名** - 体育培训课程浏览与报名
- **会员卡** - 储值卡、次卡查询与消费
- **订单管理** - 预约记录查询、取消
- **多门店** - 支持连锁场馆切换

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 + TypeScript |
| 构建工具 | Vite 5 |
| UI 组件 | Vant 4 |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| 容器化 | Docker + Nginx |

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

### 生产部署 (Docker)

```bash
cd sysh-h5

# 1. 配置环境变量
cp .env.example .env
vim .env  # 设置 DOMAIN 和 CERT_DIR

# 2. 构建并启动
docker-compose up -d

# 3. 查看日志
docker-compose logs -f
```

## 项目结构

```
sysh-h5/
├── src/
│   ├── api/          # API 接口定义
│   ├── pages/        # 页面组件
│   ├── stores/       # Pinia 状态管理
│   ├── components/   # 公共组件
│   ├── utils/        # 工具函数
│   └── router/       # 路由配置
├── server/           # Express 代理服务器
├── nginx/            # Nginx 配置 (SSL)
├── Dockerfile
└── docker-compose.yml
```

## 环境变量

| 变量 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `DOMAIN` | ✅ | 部署域名 | - |
| `CERT_DIR` | ✅ | SSL 证书目录 | - |
| `TARGET_API` | ❌ | 后端 API 地址 | https://sysh.tennis168.vip |

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## License

[MIT](./LICENSE) © 2025
