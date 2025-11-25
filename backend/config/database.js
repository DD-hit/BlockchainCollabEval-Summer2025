import mysql from 'mysql2/promise';

// 数据库配置
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`FATAL ERROR: Missing required database environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    charset: 'utf8mb4'
};

// 创建连接池（推荐）
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
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