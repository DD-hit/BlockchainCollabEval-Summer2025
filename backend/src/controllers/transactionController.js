import { TransactionService } from '../services/transactionService.js';

/**
 * 获取最近的交易记录
 */
export const getRecentTransactions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // 参数验证
        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: '限制数量必须在1-100之间'
            });
        }
        
        const transactions = await TransactionService.getRecentTransactions(limit);
        
        res.json({
            success: true,
            message: '获取最近交易记录成功',
            data: transactions
        });
    } catch (error) {
        console.error('获取最近交易记录失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * 获取交易统计信息
 */
export const getTransactionStats = async (req, res) => {
    try {
        const stats = await TransactionService.getTransactionStats();
        
        res.json({
            success: true,
            message: '获取交易统计成功',
            data: stats
        });
    } catch (error) {
        console.error('获取交易统计失败:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
