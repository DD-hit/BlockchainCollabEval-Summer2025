import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { postBaseScores, postPeerVotes } from '../controllers/contribController.js';

const router = express.Router();

// 基础分写入（items: [{ github_login, code_score, pr_score, review_score, issue_score, base_score, raw_json }]）
router.post('/round/:roundId/base-scores', verifyToken, postBaseScores);

// 互评分提交（votes: [{ target: github_login, score: 0-100 }]）
router.post('/round/:roundId/peer-votes', verifyToken, postPeerVotes);

export default router;


