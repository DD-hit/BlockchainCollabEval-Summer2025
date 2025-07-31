// server.js - 项目的"大门"
import express from 'express';
import cors from 'cors';
import accountRoutes from './src/routes/accountRoutes.js';
import projectManagerRoutes from './src/routes/projectManagerRoutes.js';
import projectMemberRoutes from './src/routes/projectMemberRoutes.js';
import milestoneRoutes from './src/routes/milestoneRoutes.js';
import subtaskRoutes from './src/routes/subtaskRoutes.js';
import { testConnection } from './config/database.js';

const app = express();
const PORT = 5000;

// 配置中间件
app.use(cors());
app.use(express.json());
// 静态文件配置 
// app.use(express.static('../frontend/public')); // React构建文件
// app.use(express.static('../frontend/src')); // React开发文件
// app.use(express.static('../test/frontend')); 
app.use(express.static('../test/backend')); 

app.get('/', (req, res) => {
    res.sendFile('log.html', { root: './test/backend' });
});

// 项目管理测试页面路由
app.get('/project-management-test.html', (req, res) => {
    res.sendFile('project-management-test.html', { root: './test/backend' });
});

// API 路由
app.use('/api/accounts', accountRoutes);
app.use('/api/projectManager', projectManagerRoutes);
app.use('/api/projectMembers', projectMemberRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/subtasks', subtaskRoutes);

// 处理React前端路由 - 所有非API请求都返回index.html
// app.get('*', (req, res) => {
//     // 对于React路由，返回index.html
//     res.sendFile('index.html', { root: '../frontend/public' }, (err) => {
//         if (err) {
//             res.status(404).json({ message: '页面不存在' });
//         }
//     });
// });

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        await testConnection();
        
        // 启动服务器
        app.listen(PORT, () => {
            console.log(`服务器运行在 http://localhost:${PORT}`);
            // console.log(`登录界面在 http://localhost:${PORT}/log.html`);
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();
