// controllers/accountController.js - 项目的"接待员"
import { AccountService } from '../services/accountService.js';

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

// 处理获取账户的请求
export const getBalance = async (req, res) => {
    try {
        const { address } = req.params;
        const balance = await AccountService.getBalance(address);
        res.json({
            success: true,
            message: '账户余额获取成功',
            data: balance
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: '账户不存在'
        });
    }
};
