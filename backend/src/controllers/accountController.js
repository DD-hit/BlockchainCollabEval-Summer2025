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
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 处理创建账户的请求
export const createAccount = async (req, res) => {
    try {
        console.log('收到创建账户请求:', req.body);
        
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

