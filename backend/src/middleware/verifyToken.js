import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const verifyToken = (req, res, next) => {
    // 1. 从请求头获取token
    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.split(' ')[1];
    
    // 2. 检查token是否存在
    if (!token) {

        return res.status(401).json({ message: '未提供token' });
    }
    
    // 3. 验证token有效性
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;  // 将用户信息注入到请求对象
        next();  // 继续执行下一个函数
    } catch (error) {

        return res.status(403).json({ message: 'token无效' });
    }
};
