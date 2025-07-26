import { pool } from '../../backend/config/database.js';

async function testQuery() {
    try {
        const result = await pool.execute('SELECT * FROM user');
        console.log('查询结果:', result);
    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        // 关闭连接池
        await pool.end();
    }
}

// 执行测试
testQuery();