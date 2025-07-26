import mysql from 'mysql2/promise';

// 数据库配置
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'bce',
    port: 3306
};

// 创建连接池（推荐）
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试连接
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ 数据库连接成功');
        connection.release();
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        process.exit(1);
    }
};

// 导出连接池和测试函数
export { pool, testConnection };
export default pool;