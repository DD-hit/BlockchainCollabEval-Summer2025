import { WebSocketServer } from 'ws';

// 初始化 WebSocket 服务，传入 HTTP 服务器和账户服务
export function setupWebSocket(server, AccountService) {
    const wss = new WebSocketServer({ server });
    const userHeartbeats = new Map(); // 记录用户最后心跳时间
    const userConnections = new Map(); // 记录用户与 ws 连接的映射

    // 心跳超时时间（默认 2 分钟）
    const HEARTBEAT_TIMEOUT_MS = parseInt(process.env.HEARTBEAT_TIMEOUT_MS || '120000', 10);
    // 定时检测用户心跳，超时则标记离线
    setInterval(() => {
        const now = Date.now();
        userHeartbeats.forEach((lastHeartbeat, username) => {
            if (now - lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
                // 超时未心跳，更新用户状态为离线
                AccountService.updateUserStatus(username, 0)
                    .catch(() => {})
                    .finally(() => {
                        userHeartbeats.delete(username);
                        userConnections.delete(username);
                    });
            }
        });
    }, 10000);

    // 监听新连接
    wss.on('connection', (ws) => {
        ws.userInfo = null;
        // 监听消息
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                switch (message.type) {
                    case 'connection':
                        // 用户连接，记录信息并设置为在线
                        ws.userInfo = { username: message.username };
                        userHeartbeats.set(message.username, Date.now());
                        userConnections.set(message.username, ws);
                        try {
                            await AccountService.updateUserStatus(message.username, 1);
                        } catch {}
                        ws.send(JSON.stringify({
                            type: 'connection_ack',
                            message: '连接已确认',
                            timestamp: Date.now()
                        }));
                        break;
                    case 'ping':
                        // 收到心跳，刷新时间并回复 pong
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
            } catch {}
        });
        // 连接关闭时，移除用户连接
        ws.on('close', () => {
            if (ws.userInfo && ws.userInfo.username) {
                userConnections.delete(ws.userInfo.username);
            }
        });
        ws.on('error', () => {});
    });

    // 全局方法：向指定用户推送通知
    global.sendWebSocketNotification = (username, notification) => {
        const ws = userConnections.get(username);
        if (ws && ws.readyState === 1) {
            try {
                ws.send(JSON.stringify({
                    type: 'notification',
                    ...notification
                }));
            } catch {}
        }
    };
}
