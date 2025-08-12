// server.js - 项目的"大门"
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import accountRoutes from './src/routes/accountRoutes.js';
import projectManagerRoutes from './src/routes/projectManagerRoutes.js';
import projectMemberRoutes from './src/routes/projectMemberRoutes.js';
import milestoneRoutes from './src/routes/milestoneRoutes.js';
import subtaskRoutes from './src/routes/subtaskRoutes.js';
import filesRoutes from './src/routes/filesRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import scoreRoutes from './src/routes/scoreRoutes.js';
import { testConnection } from './config/database.js';
import { AccountService } from './src/services/accountService.js';

const app = express();
const PORT = process.env.PORT || 5000; // 改为5000端口

// CORS配置 - 支持credentials
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:5000/',  // 添加带斜杠的版本
      'http://127.0.0.1:5000/'   // 添加带斜杠的版本
    ];
    
    console.log('🔍 请求来源 origin:', origin);
    
    // 允许没有origin的请求（如移动应用、Postman等）
    if (!origin) {
      console.log('✅ 允许无origin请求');
      return callback(null, true);
    }
    
    // 更灵活的匹配方式 - 去掉末尾斜杠后比较
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowedOrigins = allowedOrigins.map(o => o.replace(/\/$/, ''));
    
    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      console.log('✅ 允许的origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ 不允许的origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control'
  ]
};

app.use(cors(corsOptions));
app.use(express.json());
// 静态文件配置 
app.use(express.static('../frontend/public')); // React构建文件
app.use('/test', express.static('../test')); // 测试文件

// 添加请求日志中间件
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path}`);
    console.log('📝 请求体:', req.body);
    next();
});

// API 路由
app.use('/api/accounts', accountRoutes);  // 确保这行存在
app.use('/api/projects', projectManagerRoutes);
app.use('/api/projectManager', projectManagerRoutes);
app.use('/api/projectMembers', projectMemberRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/score', scoreRoutes);

// 添加404处理
app.use('*', (req, res) => {
    console.log('❌ 404 - 路由未找到:', req.originalUrl);
    res.status(404).json({
        success: false,
        message: '路由未找到'
    });
});

// 处理React前端路由 - 所有非API请求都返回index.html
app.get('*', (req, res) => {
    // 对于React路由，返回index.html
    res.sendFile('index.html', { root: '../frontend/public' }, (err) => {
        if (err) {
            res.status(404).json({ message: '页面不存在' });
        }
    });
});

// 添加全局错误处理
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
});

// 添加Express错误处理中间件
app.use((error, req, res, next) => {
    console.error('❌ Express错误处理中间件:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
    });
});

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        await testConnection();

        // 启动Express服务器
        const server = app.listen(PORT, () => {
            console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
            console.log(`🔌 WebSocket服务运行在 ws://localhost:${PORT}`);
        });

        // WebSocket服务器
        const wss = new WebSocketServer({ server });

        // 保存所有用户的心跳信息
        const userHeartbeats = new Map();

        // 心跳检测机制 - 每6秒检查一次所有连接
        const heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 9000; // 9秒超时（3个心跳周期）

            // 检查所有用户的心跳
            userHeartbeats.forEach((lastHeartbeat, username) => {
                const timeSinceLastHeartbeat = now - lastHeartbeat;
                if (timeSinceLastHeartbeat > timeout) {
                    // 更新用户状态为离线
                    AccountService.logout(username)
                        .then(() => {
                            userHeartbeats.delete(username); // 移除用户记录
                            console.log('✅ 心跳超时，用户状态已更新为离线');
                        })
                        .catch((error) => {
                            console.error('❌ 心跳超时更新用户状态失败:', error);
                            userHeartbeats.delete(username); // 移除用户记录
                        });
                }
            });
        }, 6000); // 每6秒检查一次

        wss.on('connection', (ws) => {

            // 保存用户信息到WebSocket连接
            ws.userInfo = null;

            // 处理消息
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());

                    // 处理不同类型的消息
                    switch (message.type) {
                        case 'connection':
                            console.log('🔌 收到' + message.username + '的连接确认消息');
                            ws.userInfo = { username: message.username };
                            userHeartbeats.set(message.username, Date.now());
                            ws.send(JSON.stringify({
                                type: 'connection_ack',
                                message: '连接已确认',
                                timestamp: Date.now()
                            }));
                            break;

                        case 'ping':
                            if (ws.userInfo && ws.userInfo.username) {
                                userHeartbeats.set(ws.userInfo.username, Date.now());
                                console.log('💓 收到' + ws.userInfo.username + '的心跳包，更新最后心跳时间');
                            }
                            ws.send(JSON.stringify({
                                type: 'pong',
                                timestamp: Date.now()
                            }));
                            break;

                        default:
                            console.log('📨 未处理的消息类型:', message.type);
                            break;
                    }
                } catch (error) {
                    console.error('❌ WebSocket消息解析错误:', error);
                    console.error('📨 原始数据:', data.toString());
                }
            });

            // 处理连接关闭
            ws.on('close', async (code, reason) => {
                // 连接断开时，只记录日志，不立即更新用户状态
                // 用户状态由心跳机制管理，9秒后无心跳才判定离线
                console.log('👤 用户'+ws.userInfo.username+'连接断开');
                // 注意：不删除userHeartbeats中的记录，让心跳检测继续工作
            });

            // 处理错误
            ws.on('error', (error) => {
                console.error('❌ WebSocket错误:', error);
            });
        });

    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();
