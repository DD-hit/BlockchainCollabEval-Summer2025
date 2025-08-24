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
import githubRoutes from './src/routes/githubRoutes.js';
import githubContribRoutes from './src/routes/githubContribRoutes.js';
import contribRoutes from './src/routes/contribRoutes.js';
import { testConnection } from './config/database.js';
import { AccountService } from './src/services/accountService.js';
import { encryptToken } from './src/utils/encryption.js';
import { updateUserGitHubToken, updateUserGitHubIdentity } from './src/services/accountService.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// 让 dotenv 始终从 backend 目录读取 .env（避免从仓库根目录启动时找不到）
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000; // 改为5000端口

// GitHub OAuth 配置（优先读取环境变量，未设置时使用默认值）
const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23lijDYlWd2i55uOKv'
const clientSecret = process.env.GITHUB_CLIENT_SECRET || '81cbc88f841232fb466f0d9074126a91aa63ef75'

// CORS配置 - 允许前端开发环境访问
app.use(cors({
  origin: ['http://localhost:3000', 'http://120.55.189.119', 'http://120.55.189.119:5000','http://127.0.0.1:5500','http://localhost:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 添加session中间件
import session from 'express-session';
app.use(session({
    secret: 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: false, // 开发环境设为false
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// 设置请求超时时间（默认5分钟，合约部署/多笔交易可能较慢）
app.use((req, res, next) => {
    const TIMEOUT_MS = parseInt(process.env.HTTP_TIMEOUT_MS || '300000', 10); // 5分钟
    req.setTimeout(TIMEOUT_MS);
    res.setTimeout(TIMEOUT_MS);
    next();
});

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
app.use('/api/github', githubRoutes);
app.use('/api/contrib', contribRoutes);
app.use('/api/github-contrib', githubContribRoutes);
// 辅助：根据请求推断 API/前端的对外 Base URL（兼容反代与本地开发）
const getScheme = (req) => (req.headers['x-forwarded-proto'] || req.protocol || 'http');
const getHost = (req) => (req.headers['x-forwarded-host'] || req.headers['host']);
const getApiBaseUrl = (req) => {
    const scheme = getScheme(req);
    const host = getHost(req);
    return `${scheme}://${host}`;
};
const getFrontendBaseUrl = (req) => {
    if (process.env.FRONTEND_BASE_URL) return process.env.FRONTEND_BASE_URL;
    const scheme = getScheme(req);
    const host = getHost(req) || '';
    // 本地开发：API 通常是 localhost:5000，前端在 3000
    if (/localhost:5000|127\.0\.0\.1:5000/.test(host)) {
        return 'http://localhost:3000';
    }
    // 生产：与 API 相同域名（80/443 由反代处理）
    // 去掉端口号（如果 Host 携带端口）
    const hostname = host.split(':')[0];
    return `${scheme}://${hostname}`;
};

// GitHub OAuth 路由
app.get('/api/auth/url', (req, res) => {
    const state = Math.random().toString(36).substring(2, 15)
    let username = req.session?.user;
    // 当session不存在时，尝试从Authorization的JWT中解析用户名
    if (!username) {
        try {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
            if (token) {
                const decoded = jwt.verify(token, '123456789');
                username = decoded?.username;
                if (username) {
                    req.session.user = username; // 补充设置session，后续流程可用
                }
            }
        } catch (e) {
        }
    }
    
    if (!username) {
        return res.status(401).json({ error: '请先登录系统' });
    }
    
    // 将用户名编码到state中
    const stateData = { state, username };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    const apiBase = `${scheme}://${host}`;
    const scope = encodeURIComponent('repo read:org');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(apiBase + '/api/auth/callback')}&state=${encodedState}&scope=${scope}`;
    

    res.json({ authUrl })
 })

 // 检查GitHub连接状态
 app.get('/api/auth/status', async (req, res) => {
     let username = req.session?.user;
     // 当session不存在时，尝试从Authorization的JWT中解析用户名
     if (!username) {
         try {
             const authHeader = req.headers.authorization || '';
             const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
             if (token) {
                 const decoded = jwt.verify(token, '123456789');
                 username = decoded?.username;
             }
         } catch (e) {
         }
     }
     
     if (!username) {
         return res.status(401).json({ error: '请先登录系统' });
     }
     
     try {
         const { getUserGitHubToken } = await import('./src/services/accountService.js');
         const token = await getUserGitHubToken(username);
         
         if (token) {
             res.json({ connected: true, message: 'GitHub已连接' });
         } else {
             res.json({ connected: false, message: 'GitHub未连接' });
         }
     } catch (error) {
         console.error('检查GitHub连接状态失败:', error);
         res.json({ connected: false, message: '检查连接状态失败' });
     }
 })

app.get('/api/auth/callback', async (req, res) => {
    const code = req.query.code
    const state = req.query.state
    

    
    if(!code){
        return res.json({ error: '缺少code' })
    }
    
    try {
        // 重试机制函数
        const fetchWithRetry = async (url, options, maxRetries = 3) => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45秒超时
                    
                    const response = await fetch(url, {
                        ...options,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    return response;
                } catch (error) {
                    if (i === maxRetries - 1) throw error;
                    // 等待2秒后重试
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        };
        
        const tokenResponse = await fetchWithRetry('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'BlockchainCollabEval/1.0'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: `${(req.headers['x-forwarded-proto'] || req.protocol || 'http')}://${(req.headers['x-forwarded-host'] || req.headers['host'])}/api/auth/callback`
            })
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`GitHub API响应错误: ${tokenResponse.status} ${tokenResponse.statusText}`);
        }
        
        const data = await tokenResponse.json()
        
        if (data.access_token) {
            // 从state参数中获取用户信息
            let currentUser = null;
            
            try {
                const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
                currentUser = stateData.username;
            } catch (error) {
                currentUser = req.session?.user;
            }
            
            if (!currentUser) {
                const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                const host = req.headers['x-forwarded-host'] || req.headers['host'];
                const feBase = /localhost:5000|127\.0\.0\.1:5000/.test(host || '') ? 'http://localhost:3000' : `${scheme}://${(host || '').split(':')[0]}`;
                return res.redirect(`${feBase}/login?error=请先登录系统`);
            }
            
            try {
                // 加密token并存储到数据库
                const encryptedToken = await encryptToken(data.access_token);
                await updateUserGitHubToken(currentUser, encryptedToken);
                // 获取GitHub身份信息并保存
                try {
                    const { Octokit } = await import('octokit');
                    const ok = new Octokit({ auth: data.access_token });
                    const { data: ghUser } = await ok.rest.users.getAuthenticated();
                    await updateUserGitHubIdentity(currentUser, {
                        login: ghUser?.login || null,
                        id: ghUser?.id || null,
                        avatar: ghUser?.avatar_url || null
                    });
                } catch (e) {
                    console.error('获取GitHub身份失败（忽略，不影响绑定）:', e?.message || e);
                }
                
                {
                    const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                    const host = req.headers['x-forwarded-host'] || req.headers['host'];
                    const feBase = /localhost:5000|127\.0\.0\.1:5000/.test(host || '') ? 'http://localhost:3000' : `${scheme}://${(host || '').split(':')[0]}`;
                    res.redirect(`${feBase}/dashboard?success=true&message=GitHub连接成功`);
                }
            } catch (error) {
                console.error('存储token失败:', error);
                {
                    const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                    const host = req.headers['x-forwarded-host'] || req.headers['host'];
                    const feBase = /localhost:5000|127\.0\.0\.1:5000/.test(host || '') ? 'http://localhost:3000' : `${scheme}://${(host || '').split(':')[0]}`;
                    res.redirect(`${feBase}/dashboard?error=Token存储失败`);
                }
            }
        } else {
            {
                const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
                const host = req.headers['x-forwarded-host'] || req.headers['host'];
                const feBase = /localhost:5000|127\.0\.0\.1:5000/.test(host || '') ? 'http://localhost:3000' : `${scheme}://${(host || '').split(':')[0]}`;
                res.redirect(`${feBase}/dashboard?error=GitHub授权失败`);
            }
        }
    } catch (error) {
        console.error('GitHub OAuth错误:', error);
        
        // 提供更详细的错误信息
        {
            const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
            const host = req.headers['x-forwarded-host'] || req.headers['host'];
            const feBase = /localhost:5000|127\.0\.0\.1:5000/.test(host || '') ? 'http://localhost:3000' : `${scheme}://${(host || '').split(':')[0]}`;
            if (error.message && (error.message.includes('timeout') || error.message.includes('abort') || error.message.includes('ConnectTimeoutError'))) {
                res.redirect(`${feBase}/dashboard?error=网络连接超时，请检查网络连接后重试`);
            } else if (error.message && error.message.includes('GitHub API响应错误')) {
                res.redirect(`${feBase}/dashboard?error=GitHub服务暂时不可用，请稍后重试`);
            } else if (error.message && error.message.includes('fetch failed')) {
                res.redirect(`${feBase}/dashboard?error=网络连接失败，请检查网络设置后重试`);
            } else {
                res.redirect(`${feBase}/dashboard?error=GitHub连接失败，请稍后重试`);
            }
        }
    }
})

// GitHub API 路由
app.use('/api/github', githubRoutes);

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

                          // 心跳检测机制 - 每10秒检查一次所有连接
        const HEARTBEAT_TIMEOUT_MS = parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '120000', 10); // 默认2分钟
        const heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = HEARTBEAT_TIMEOUT_MS;

            // 检查所有用户的心跳
            userHeartbeats.forEach((lastHeartbeat, username) => {
                const timeSinceLastHeartbeat = now - lastHeartbeat;

                if (timeSinceLastHeartbeat > timeout) {
                    // 仅将用户状态置为离线，不清理GitHub token，避免误判导致断连
                    AccountService.updateUserStatus(username, 0)
                        .catch((error) => console.error('心跳超时更新用户状态失败:', error))
                        .finally(() => {
                            userHeartbeats.delete(username);
                            userConnections.delete(username);
                        });
                }
            });
        }, 10000); // 每10秒检查一次

        wss.on('connection', (ws) => {

            // 保存用户信息到WebSocket连接
            ws.userInfo = null;

            // 处理消息
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());

                    // 处理不同类型的消息
                    switch (message.type) {
                        case 'connection':

                            ws.userInfo = { username: message.username };
                            userHeartbeats.set(message.username, Date.now());
                            userConnections.set(message.username, ws);

                                                         // 更新用户状态为在线
                             try {
                                 await AccountService.updateUserStatus(message.username, 1);
                             } catch (error) {
                                 console.error('更新用户在线状态失败:', error);
                             }

                            // 发送连接确认
                            ws.send(JSON.stringify({
                                type: 'connection_ack',
                                message: '连接已确认',
                                timestamp: Date.now()
                            }));

                            // 注释掉发送未读通知，避免与HTTP API重复
                            // sendUnreadNotifications(message.username);
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
                 // 连接断开时，只清理连接记录，不立即更新状态
                 // 让心跳机制来处理状态更新
                 if (ws.userInfo && ws.userInfo.username) {
                     userConnections.delete(ws.userInfo.username);
                     // 注意：不删除userHeartbeats中的记录，让心跳检测继续工作
                 }
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
