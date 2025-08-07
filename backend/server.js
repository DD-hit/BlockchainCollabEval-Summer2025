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
import { testConnection } from './config/database.js';
import { AccountService } from './src/services/accountService.js';

const app = express();
const PORT = 5000;

// 配置中间件
app.use(cors());
app.use(express.json());
// 静态文件配置 
app.use(express.static('../frontend/public')); // React构建文件

// API 路由
app.use('/api/accounts', accountRoutes);
app.use('/api/projectManager', projectManagerRoutes);
app.use('/api/projectMembers', projectMemberRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/files', filesRoutes);

// 处理React前端路由 - 所有非API请求都返回index.html
app.get('*', (req, res) => {
    // 对于React路由，返回index.html
    res.sendFile('index.html', { root: '../frontend/public' }, (err) => {
        if (err) {
            res.status(404).json({ message: '页面不存在' });
        }
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
                    console.log('⏰ 心跳超时，用户离线:', username);
                    // 更新用户状态为离线
                    AccountService.logout(username)
                        .then(() => {
                            console.log('✅ 心跳超时，用户状态已更新为离线');
                            userHeartbeats.delete(username); // 移除用户记录
                        })
                        .catch((error) => {
                            console.error('❌ 心跳超时更新用户状态失败:', error);
                            userHeartbeats.delete(username); // 移除用户记录
                        });
                }
            });
        }, 6000); // 每6秒检查一次
        
        wss.on('connection', (ws) => {
            console.log('🔌 WebSocket客户端已连接');
            
            // 保存用户信息到WebSocket连接
            ws.userInfo = null;
            
            // 处理消息
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    console.log('📨 收到WebSocket消息:', message);
                    
                    // 处理不同类型的消息
                    switch (message.type) {
                        case 'connection':
                            console.log('🔌 收到连接确认消息');
                            // 保存用户信息（如果有的话）
                            if (message.username) {
                                ws.userInfo = { username: message.username };
                                userHeartbeats.set(message.username, Date.now());
                                console.log('👤 保存用户信息:', message.username);
                            }
                            ws.send(JSON.stringify({
                                type: 'connection_ack',
                                message: '连接已确认',
                                timestamp: Date.now()
                            }));
                            break;
                            
                        case 'ping':
                            if (ws.userInfo && ws.userInfo.username) {
                                userHeartbeats.set(ws.userInfo.username, Date.now());
                                console.log('💓 收到心跳包，更新最后心跳时间');
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
                console.log('🔌 WebSocket客户端已断开连接', code, reason);
                
                // 连接断开时，只记录日志，不立即更新用户状态
                // 用户状态由心跳机制管理，9秒后无心跳才判定离线
                if (ws.userInfo && ws.userInfo.username) {
                    console.log('👤 用户连接断开:', ws.userInfo.username);
                    console.log('📄 等待心跳机制判定用户状态（9秒后无心跳将标记为离线）');
                    // 注意：不删除userHeartbeats中的记录，让心跳检测继续工作
                }
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
