# 开发环境设置指南

## 环境要求

- Node.js 18.x 或 20.x (推荐)
- npm 8.x 或更高版本

## 快速启动

1. 安装依赖：
```bash
npm run install:all
```

2. 启动开发环境：
```bash
npm run dev
```

## 常见问题解决

### 1. allowedHosts 错误

如果遇到 `options.allowedHosts[0] should be a non-empty string` 错误：

**解决方案**：在 `frontend/` 目录下创建 `.env` 文件：

```bash
# 禁用主机检查
DANGEROUSLY_DISABLE_HOST_CHECK=true

# WebSocket 连接配置
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000

# 开发服务器配置
HOST=localhost
PORT=3000
```

### 2. 端口占用问题

如果 3000 端口被占用，可以修改 `.env` 文件中的 PORT：

```bash
PORT=3001
```

### 3. Node.js 版本问题

推荐使用 Node.js 18.x LTS 版本，避免兼容性问题。

## 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DANGEROUSLY_DISABLE_HOST_CHECK` | 禁用主机检查 | `true` |
| `WDS_SOCKET_HOST` | WebSocket 主机 | `localhost` |
| `WDS_SOCKET_PORT` | WebSocket 端口 | `3000` |
| `HOST` | 开发服务器主机 | `localhost` |
| `PORT` | 开发服务器端口 | `3000` |
| `REACT_APP_API_URL` | API 服务器地址 | `http://localhost:5000` |

## 项目结构

```
BlockchainCollabEval-Summer2025/
├── frontend/          # React 前端
├── backend/           # Node.js 后端
├── contracts/         # 智能合约
└── docs/             # 文档
```
