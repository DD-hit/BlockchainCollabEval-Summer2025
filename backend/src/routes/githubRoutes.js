import express from 'express';
import GitHubController from '../controllers/githubController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// 使用JWT验证中间件
router.use(verifyToken);

// 用户相关路由
router.get('/user', GitHubController.getUserInfo);
router.get('/repos', GitHubController.getUserRepos);

// 仓库相关路由
router.get('/repos/:owner/:repo', GitHubController.getRepoInfo);
router.get('/repos/:owner/:repo/milestones', GitHubController.getRepoMilestones);
router.get('/repos/:owner/:repo/issues', GitHubController.getRepoIssues);
router.get('/repos/:owner/:repo/contributors', GitHubController.getRepoContributors);
router.get('/repos/:owner/:repo/commits', GitHubController.getRepoCommits);
router.get('/repos/:owner/:repo/pulls', GitHubController.getRepoPullRequests);
router.get('/repos/:owner/:repo/stats', GitHubController.getRepoStats);

// 贡献分数路由
router.get('/repos/:owner/:repo/contribution/:username', GitHubController.getContributionScore);

export default router;
