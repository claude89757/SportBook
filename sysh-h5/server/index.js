const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_API = process.env.TARGET_API || 'https://sysh.tennis168.vip';

// 启用 CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authori-zation', 'store-id', 'Form-type', 'Authorization']
}));

// 解析 JSON 请求体
app.use(express.json());

// API 代理配置
const apiProxy = createProxyMiddleware({
  target: TARGET_API,
  changeOrigin: true,
  pathRewrite: { '^/proxy': '' },
  onProxyReq: (proxyReq, req) => {
    // 设置 Form-type
    proxyReq.setHeader('Form-type', req.headers['form-type'] || 'h5');

    // 转发认证 header
    if (req.headers['authori-zation']) {
      proxyReq.setHeader('Authori-zation', req.headers['authori-zation']);
    }

    // 转发门店 ID
    if (req.headers['store-id']) {
      proxyReq.setHeader('store-id', req.headers['store-id']);
    }

    // 如果有请求体，需要重新设置 Content-Length
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // 添加 CORS 头
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authori-zation,store-id,Form-type';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// 处理 OPTIONS 预检请求
app.options('/proxy/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authori-zation,store-id,Form-type');
  res.sendStatus(200);
});

// 代理 API 请求
app.use('/proxy', apiProxy);

// 静态文件服务（生产环境）
app.use(express.static(path.join(__dirname, '../dist')));

// SPA 回退
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Not found - Run npm run build first');
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 API proxied to: ${TARGET_API}`);
  console.log(`\nTest endpoints:`);
  console.log(`  - http://localhost:${PORT}/proxy/api/agreement`);
  console.log(`  - http://localhost:${PORT}/proxy/api/ajcaptcha?captchaType=blockPuzzle`);
});
