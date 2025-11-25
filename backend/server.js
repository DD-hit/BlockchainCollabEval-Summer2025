// server.js - 项目的"大门"
import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import session from 'express-session';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

import { testConnection } from './config/database.js';
import { AccountService } from './src/services/accountService.js';

const __filename = fileURLToPath(import.meta.url); // C:\StudyFile\项目\BlockchainCollabEval-Summer2025\backend\server.js
const __dirname = path.dirname(__filename); // C:\StudyFile\项目\BlockchainCollabEval-Summer2025\backend

const app = express();
const PORT = process.env.PORT || 5000;

//指定允许访问后端接口的前端域名（“源”）
app.use(cors({
  origin: ['http://localhost:3000', 'http://120.55.189.119', 'http://120.55.189.119:5000','http://127.0.0.1:5500','http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//自动完成 “接收请求体 → 解析 JSON → 挂载到 req.body” 的全流程
app.use(express.json()); 


app.use(session({
    secret: process.env.SESSION_SECRET, // 用于加密 session id 的密钥，防止伪造
    resave: false,                       // 每次请求都重新保存 session（一般建议设为 false）
    saveUninitialized: false,            // 未初始化的 session 是否保存（首次访问就设置 cookie）
    cookie: { 
        secure: false,                  // 是否只通过 HTTPS 发送 cookie（开发环境设为 false，生产建议 true）
        maxAge: 24 * 60 * 60 * 1000,    // cookie 有效期，单位毫秒，这里是 1 天
        httpOnly: true,                 // 只能通过 HTTP(S) 访问，JS 不能读取，防止 XSS
        sameSite: 'lax'                 // 防止部分 CSRF 攻击，允许部分跨站请求携带 cookie
    }
}));

// 设置请求超时时间
app.use((req, res, next) => {
    const TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS || '300000', 10);
    req.setTimeout(TIMEOUT_MS);
    res.setTimeout(TIMEOUT_MS);
    next();
});

// 提供静态文件服务（前端构建后的文件）
app.use(express.static(path.join(__dirname, 'public')));

// 独立的API路由
import apiRouter from './src/routes/apiRouter.js';
app.use('/api', apiRouter);

// 独立的GitHub OAuth路由
import githubOAuthRouter from './src/routes/githubOAuthRouter.js';
app.use('/api', githubOAuthRouter);

// React路由兜底
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) res.status(404).json({ message: '页面不存在' });
    });
});

// 404错误处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '路由未找到'
    });
});

// 全局错误处理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
});
app.use((error, req, res, next) => {
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
    });
});

// 启动服务器
const startServer = async () => {
    try {
        await testConnection();
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
        });

        // WebSocket服务器独立
        import('./src/ws/websocket.js').then(({ setupWebSocket }) => {
            setupWebSocket(server, AccountService);
        });

    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();
