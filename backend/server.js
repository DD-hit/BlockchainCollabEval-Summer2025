// server.js - 项目的"大门"
import express from 'express';
import cors from 'cors';
import path from 'path';
import accountRoutes from './src/routes/accountRoutes.js';


const app = express();
const PORT = 3000;

// 配置中间件
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile('log.html', { root: './test/backend' });
});

app.use('/api/accounts', accountRoutes);



// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:3000`);
});
