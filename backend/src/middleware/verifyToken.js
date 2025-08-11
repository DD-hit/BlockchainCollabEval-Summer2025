import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. 从请求头获取token
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // 调试日志
    const token = authHeader && authHeader.split(' ')[1];
    
    // 2. 检查token是否存在
    if (!token) {
        console.log('No token provided'); // 调试日志
        return res.status(401).json({ message: '未提供token' });
    }
    
    // 3. 验证token有效性
    try {
        const decoded = jwt.verify(token, "123456789");
        console.log('Token decoded:', decoded); // 调试日志
        req.user = decoded;  // 将用户信息注入到请求对象
        next();  // 继续执行下一个函数
    } catch (error) {
        console.log('Token verification failed:', error.message); // 调试日志
        return res.status(403).json({ message: 'token无效' });
    }
};
