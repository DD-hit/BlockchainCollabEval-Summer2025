import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { isAccessTokenSessionActive } from '../services/authTokens.js';

dotenv.config();

export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: '未提供token' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ message: '服务器未配置 JWT_SECRET' });
    }

    try {
        const decoded = jwt.verify(token, secret);
        const sessionOk = await isAccessTokenSessionActive(decoded);
        if (!sessionOk) {
            return res.status(401).json({
                message: 'token已失效，请重新登录（可能已在其他设备登录）',
                code: 'SESSION_REVOKED'
            });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'token无效或已过期，请重新登录',
            code: 'INVALID_TOKEN'
        });
    }
};
