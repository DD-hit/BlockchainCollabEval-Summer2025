import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { startContributionRound, submitPeerVotesOnchain, finalizeAndGetScores, getProgress, getLeaderboardByRepo, getUserRounds } from '../controllers/githubContribController.js';

const router = express.Router();

// 启动轮次、部署并上链基础数据
router.post('/start', verifyToken, startContributionRound);

// 评审者提交投票
router.post('/:contractAddress/vote', verifyToken, submitPeerVotesOnchain);

// 完成并拉取结果
router.post('/:contractAddress/finalize', verifyToken, finalizeAndGetScores);

// 进度查询
router.get('/:contractAddress/progress', verifyToken, getProgress);

// 最新一轮排行榜（常驻显示）
router.get('/leaderboard/by-repo', verifyToken, getLeaderboardByRepo);

// 用户每轮明细
router.get('/user-rounds', verifyToken, getUserRounds);

export default router;


