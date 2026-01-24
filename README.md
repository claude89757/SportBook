# SYSH-H5

H5 移动端体育场馆预约平台，基于 Vue 3 + TypeScript + Vite 5 构建。

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
