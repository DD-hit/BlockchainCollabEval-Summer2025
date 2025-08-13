// controllers/accountController.js - 项目的"接待员"
import { AccountService } from '../services/accountService.js';

// 处理登录的请求
export const loginAccount = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await AccountService.loginAccount(username, password);
        res.json({
            success: true,
            message: '登录成功',
            data: result
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// 处理创建账户的请求
export const createAccount = async (req, res) => {
    try {

        
        // 1. 获取请求数据
        const { username, password } = req.body;
        
        // 2. 调用业务逻辑层处理
        const result = await AccountService.createAccount(username, password);
        
        // 3. 返回成功响应
        res.json({
            success: true,
            message: '账户创建成功',
            data: result
        });
        
    } catch (error) {
        console.error('创建账户失败:', error);
        
        // 4. 返回错误响应
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getBalance = async (req, res) => {
    try {
        const address = req.user.address;
        const balance = await AccountService.getBalance(address);
        res.json({
            success: true,
            message: '余额获取成功',
            data: balance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 处理更新用户信息的请求
export const updateProfile = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await AccountService.updateProfile(username, password);
        res.json({
            success: true,
            message: '用户信息更新成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        
        // 支持从请求体、查询参数或token获取username
        let username;
        if (req.body && req.body.username) {
            username = req.body.username;
    
        } else if (req.query && req.query.username) {
            username = req.query.username;

        } else if (req.user && req.user.username) {
            username = req.user.username;

        } else {
            throw new Error('用户名不能为空');
        }
        
        if (!username) {
            throw new Error('用户名不能为空');
        }
        
        const result = await AccountService.logout(username);

        
        // 对于sendBeacon请求，返回简单的响应
        if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            res.json({
                success: true,
                message: '退出登录成功',
                data: result
            });
        } else {
            // 对于其他类型的请求，返回简单的文本响应
            res.status(200).send('OK');
        }
    } catch (error) {
        console.error('logout控制器错误:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 处理获取私钥的请求
export const getPrivateKey = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await AccountService.getPrivateKey(username, password);
        res.json({
            success: true,
            message: '私钥获取成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
