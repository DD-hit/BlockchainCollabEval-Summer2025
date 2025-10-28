# Blockchain Collaboration Evaluation System

基于区块链技术的协作评估系统，用于透明、公正地评估团队成员在项目中的贡献。

## 🌟 主要功能

- **智能合约评分系统** - 基于以太坊的透明评分机制
- **项目管理** - 项目创建、管理和跟踪
- **里程碑管理** - 项目里程碑创建和进度跟踪
- **任务分解** - 子任务创建和分配
- **成员管理** - 项目成员邀请和权限管理
- **文件管理** - 项目文件上传和版本控制
- **实时通知** - WebSocket 实时通知系统
- **贡献评估** - 多维度贡献评分算法

## 🛠️ 技术栈

### 前端
- React 18.2.0
- React Router 6.8.0
- Axios
- Web3.js

### 后端
- Node.js
- Express.js
- MySQL2
- JWT
- WebSocket
- Multer
- Crypto-js

### 区块链
- Solidity 0.5.0
- 以太坊
- Web3.js

## 📋 系统要求

- Node.js v22.12.0
- npm 10.9.0
- MySQL 数据库
- 以太坊节点

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/DD-hit/BlockchainCollabEval-Summer2025.git
```

### 2. 安装依赖
```bash
npm run install:all
```

### 3. 环境配置

#### 前端配置 (frontend/.env)
```bash
DANGEROUSLY_DISABLE_HOST_CHECK=true
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000
HOST=localhost
PORT=3000
REACT_APP_API_URL=http://localhost:5000
```

#### 后端配置 (backend/.env)
```bash
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=blockchain_collab_eval
JWT_SECRET=your_jwt_secret_key
PORT=5000
ETHEREUM_NETWORK=localhost:8545
CONTRACT_ADDRESS=your_contract_address
```

### 4. 数据库设置
```bash
mysql -u your_username -p your_database < docs/bce.sql
```

### 5. 以太坊私链搭建

#### 5.1 安装 Geth
首先确保已安装 Go Ethereum (Geth) 客户端：
```bash
# Ubuntu/Debian
sudo apt-get install ethereum

# macOS
brew install ethereum

# Windows
# 从 https://geth.ethereum.org/downloads/ 下载安装包
```

#### 5.2 初始化私链
```bash
# 创建数据目录（请根据实际情况修改路径）
mkdir -p ~/privatechain/data

# 初始化私链
geth --datadir ~/privatechain/data init docs/genesis.json
```

#### 5.3 启动私链节点
```bash
# 启动初始节点
geth --datadir ./data \
     --networkid 123 \
     --http \
     --http.port 8545 \
     --http.addr 0.0.0.0 \
     --nodiscover \
     --allow-insecure-unlock \
     --http.corsdomain "*" \
     console
```

#### 5.4 常用 Geth 参数说明
- `--datadir`: 数据目录路径
- `--networkid`: 网络ID（与genesis.json中的chainId一致）
- `--http`: 启用HTTP-RPC服务器
- `--http.port`: HTTP-RPC端口
- `--http.addr`: HTTP-RPC监听地址
- `--nodiscover`: 禁用节点发现
- `--allow-insecure-unlock`: 允许不安全的账户解锁
- `--http.corsdomain`: 允许的CORS域名
- `--mine`: 启用挖矿
- `--miner.threads`: 挖矿线程数
- `--unlock`: 解锁账户（需要配合--password使用）

#### 5.5 创建账户和挖矿
在Geth控制台中执行：
```javascript
// 创建新账户
personal.newAccount("your_password")

// 查看账户列表
eth.accounts

// 开始挖矿
miner.start(1)  // 1表示使用1个线程

// 停止挖矿
miner.stop()

// 查看余额
eth.getBalance(eth.accounts[0])
```

### 6. 启动应用
```bash
# 同时启动前端和后端
npm run dev

# 或者分别启动
npm run start:backend  # 后端服务器 (端口 5000)
npm run start:frontend # 前端开发服务器 (端口 3000)
```

## 📖 使用指南

### 项目创建
1. 注册/登录系统
2. 点击"创建项目"
3. 填写项目基本信息
4. 设置项目成员和权限

### 任务管理
1. 在项目中创建里程碑
2. 为里程碑添加子任务
3. 分配任务给团队成员
4. 跟踪任务进度

### 贡献评估
1. 成员提交任务完成情况
2. 其他成员对贡献进行评分
3. 系统自动计算综合评分
4. 评分记录存储在区块链上

## 🏗️ 项目结构

```
BlockchainCollabEval-Summer2025/
├── frontend/                 # React 前端应用
├── backend/                  # Node.js 后端服务
├── contracts/               # 智能合约
├── docs/                    # 项目文档
│   ├── bce.sql             # 数据库结构文件
│   └── genesis.json        # 以太坊私链配置文件
└── test/                    # 测试文件
```

## 🔧 开发指南

### 构建
```bash
npm run build
```

### 测试
```bash
cd frontend && npm test
cd backend && npm test
```

## 📝 许可证

本项目采用 MIT 许可证。

## 🆘 常见问题

### 端口占用问题
修改 `frontend/.env` 中的 PORT：
```bash
PORT=3001
```

### 数据库连接问题
确保 MySQL 服务正在运行，检查数据库配置。

### 区块链连接问题
确保以太坊节点可访问，或使用测试网络。

### 私链连接问题
- 确保Geth节点正在运行并监听8545端口
- 检查网络ID是否与genesis.json中的chainId一致
- 确保账户已解锁：`personal.unlockAccount(eth.accounts[0], "password")`
- 检查防火墙设置，确保端口8545可访问

---

**注意**: 这是一个学术研究项目，请在生产环境中使用前进行充分的安全审计和测试。
