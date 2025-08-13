// routes/scoreRoutes.js - 评分路由
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    submitScore,
    getContractInfo,
    getAverageScore,
    getScorersCount,
    getContributionPoints,
    getUserScore,
    getTimeFactor,
    updateContributionPoint,
    getMemberContributions,
    getProjectContributions,
    manualUpdateContributionPoint,
    checkScoreStatus
} from '../controllers/scoreController.js';

const router = express.Router();

// ==================== 写入操作 ====================

/**
 * POST /api/score/submit
 * 提交评分
 * 需要验证token
 * Body: { contractAddress, score, privateKey }
 */
router.post('/submit', verifyToken, submitScore);

// ==================== 读取操作 ====================

/**
 * GET /api/score/contract/:contractAddress
 * 获取合约完整信息（包含所有关键数据）
 * 需要验证token
 */
router.get('/contract/:contractAddress', verifyToken, getContractInfo);

/**
 * GET /api/score/average/:contractAddress
 * 获取平均分
 * 需要验证token
 */
router.get('/average/:contractAddress', verifyToken, getAverageScore);

/**
 * GET /api/score/count/:contractAddress
 * 获取评分者数量
 * 需要验证token
 */
router.get('/count/:contractAddress', verifyToken, getScorersCount);

/**
 * GET /api/score/points/:contractAddress
 * 获取贡献点数（含详细计算信息）
 * 需要验证token
 */
router.get('/points/:contractAddress', verifyToken, getContributionPoints);


/**
 * GET /api/score/user-score/:contractAddress
 * 获取用户的评分
 * Query: ?userAddress=0x... (可选，不传则查询当前用户)
 * 需要验证token
 */
router.get('/user-score/:contractAddress', verifyToken, getUserScore);

/**
 * GET /api/score/time-factor/:contractAddress
 * 获取时间因子及相关时间信息
 * 需要验证token
 */
router.get('/time-factor/:contractAddress', verifyToken, getTimeFactor);

/**
 * GET /api/score/updateContributionPoint/:contractAddress
 * 更新贡献点
 * 需要验证token
 */
router.get('/updateContributionPoint/:contractAddress', verifyToken, updateContributionPoint);

/**
 * GET /api/score/getMemberContributions/:projectId
 * 获取成员贡献
 * 需要验证token
 */
router.get('/getMemberContributions/:projectId', verifyToken, getMemberContributions);

/**
 * GET /api/score/getProjectContributions/:projectId
 * 获取项目贡献统计
 * 需要验证token
 */
router.get('/getProjectContributions/:projectId', verifyToken, getProjectContributions);

/**
 * POST /api/score/manual-update/:contractAddress
 * 手动更新贡献点（用于调试和手动触发）
 * 需要验证token
 */
router.post('/manual-update/:contractAddress', verifyToken, manualUpdateContributionPoint);

/**
 * GET /api/score/status/:contractAddress
 * 检查评分状态
 * 需要验证token
 */
router.get('/status/:contractAddress', verifyToken, checkScoreStatus);

export default router;
