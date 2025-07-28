// server.js - 项目的"大门"
import express from 'express';
import cors from 'cors';
import accountRoutes from './src/routes/accountRoutes.js';
import projectManagerRoutes from './src/routes/projectManagerRoutes.js';
import projectMemberRoutes from './src/routes/projectMemberRoutes.js';
import { testConnection } from './config/database.js';

const app = express();
const PORT = 3000;

// 配置中间件
app.use(cors());
app.use(express.json());
app.use(express.static('./test/backend')); // 静态文件

// 根路径重定向到登录页面
app.get('/', (req, res) => {
    res.redirect('/log.html');
});

// API 路由
app.use('/api/accounts', accountRoutes);
app.use('/api/projectManager', projectManagerRoutes);
app.use('/api/projectMembers', projectMemberRoutes);

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        await testConnection();
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();
