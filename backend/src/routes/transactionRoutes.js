import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getRecentTransactions,
    getTransactionStats
} from '../controllers/transactionController.js';

const router = express.Router();

/**
 * GET /api/transactions/recent
 * 获取最近的交易记录
 * 需要验证token
 */
router.get('/recent', verifyToken, getRecentTransactions);

/**
 * GET /api/transactions/stats
 * 获取交易统计信息
 * 需要验证token
 */
router.get('/stats', verifyToken, getTransactionStats);

export default router;
