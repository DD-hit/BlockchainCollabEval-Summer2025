// server.js - 项目的"大门"
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import accountRoutes from './src/routes/accountRoutes.js';
import projectManagerRoutes from './src/routes/projectManagerRoutes.js';
import projectMemberRoutes from './src/routes/projectMemberRoutes.js';
import milestoneRoutes from './src/routes/milestoneRoutes.js';
import subtaskRoutes from './src/routes/subtaskRoutes.js';
import filesRoutes from './src/routes/filesRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import scoreRoutes from './src/routes/scoreRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import { testConnection } from './config/database.js';
import { AccountService } from './src/services/accountService.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000; // 改为5000端口

// CORS配置 - 允许前端开发环境访问
app.use(cors({
  origin: ['http://localhost:3000', 'http://120.55.189.119:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 1. 静态文件托管（最优先）- 使用绝对路径
app.use(express.static(path.join(__dirname, 'public')));

// 添加请求日志中间件
app.use((req, res, next) => {
    next();
});

// 2. API 路由（其次）
app.use('/api/accounts', accountRoutes);  // 确保这行存在
app.use('/api/projects', projectManagerRoutes);
app.use('/api/projectManager', projectManagerRoutes);
app.use('/api/projectMembers', projectMemberRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/score', scoreRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/transactions', transactionRoutes);

// 3. React路由兜底（处理单页应用路由，必须在API路由之后）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            res.status(404).json({ message: '页面不存在' });
        }
    });
});

// 4. 404错误处理（最后，处理非API且非前端路由的请求）
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '路由未找到'
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
        const server = app.listen(PORT, '0.0.0.0', () => {
            // console.log(`服务器运行在 http://120.55.189.119:${PORT}`);
            console.log(`服务器运行在 http://localhost:${PORT}`);
        });

        // WebSocket服务器
        const wss = new WebSocketServer({ server });

        // 保存所有用户的心跳信息
        const userHeartbeats = new Map();

        // 保存用户WebSocket连接
        const userConnections = new Map();

        // 发送未读通知给用户
        const sendUnreadNotifications = async (username) => {
            try {
                const { NotificationService } = await import('./src/services/notificationService.js');
                const unreadNotifications = await NotificationService.getNotificationList(username);



                for (const notification of unreadNotifications) {
                    const ws = userConnections.get(username);
                    if (ws && ws.readyState === 1) {
                        try {
                            const content = JSON.parse(notification.content || '{}');
                            ws.send(JSON.stringify({
                                type: 'notification',
                                title: '未读通知',
                                message: `您有来自 ${notification.sender} 的文件上传通知`,
                                link: `/subtask/${notification.subtaskId}`,
                                meta: {
                                    type: 'file_upload',
                                    projectId: content.projectId,
                                    subtaskId: notification.subtaskId,
                                    fileId: notification.fileId,
                                    fileName: content.fileName,
                                    uploader: notification.sender,
                                    notificationId: notification.id
                                },
                                timestamp: new Date(notification.createdTime).getTime()
                            }));

                        } catch (error) {
                            console.error(`发送未读通知失败: ${error.message}`);
                        }
                    } else {

                    }
                }
            } catch (error) {
                console.error(`❌ 获取未读通知失败: ${error.message}`);
            }
        };

        // 心跳检测机制 - 每60秒检查一次所有连接
        const heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = 90000; // 90秒超时（3个心跳周期）

            // 检查所有用户的心跳
            userHeartbeats.forEach((lastHeartbeat, username) => {
                const timeSinceLastHeartbeat = now - lastHeartbeat;
                if (timeSinceLastHeartbeat > timeout) {
                    // 更新用户状态为离线
                    AccountService.logout(username)
                        .then(() => {
                            userHeartbeats.delete(username); // 移除用户记录

                        })
                        .catch((error) => {
                            console.error('❌ 心跳超时更新用户状态失败:', error);
                            userHeartbeats.delete(username); // 移除用户记录
                        });
                }
            });
        }, 60000); // 每60秒检查一次

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

                            ws.userInfo = { username: message.username };
                            userHeartbeats.set(message.username, Date.now());
                            userConnections.set(message.username, ws);

                            // 发送连接确认
                            ws.send(JSON.stringify({
                                type: 'connection_ack',
                                message: '连接已确认',
                                timestamp: Date.now()
                            }));

                            // 发送未读通知
                            sendUnreadNotifications(message.username);
                            break;

                        case 'ping':
                            if (ws.userInfo && ws.userInfo.username) {
                                userHeartbeats.set(ws.userInfo.username, Date.now());

                            }
                            ws.send(JSON.stringify({
                                type: 'pong',
                                timestamp: Date.now()
                            }));
                            break;

                        default:

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
                if (ws.userInfo && ws.userInfo.username) {

                    userConnections.delete(ws.userInfo.username);
                }
                // 注意：不删除userHeartbeats中的记录，让心跳检测继续工作
            });

            // 处理错误
            ws.on('error', (error) => {
                console.error('❌ WebSocket错误:', error);
            });
        });

        // 导出WebSocket通知函数供其他模块使用
        global.sendWebSocketNotification = (username, notification) => {
            const ws = userConnections.get(username);
            if (ws && ws.readyState === 1) { // WebSocket.OPEN
                try {
                    ws.send(JSON.stringify({
                        type: 'notification',
                        ...notification
                    }));

                } catch (error) {
                    console.error(`发送WebSocket通知失败: ${error.message}`);
                }
            } else {

            }
        };

    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();
