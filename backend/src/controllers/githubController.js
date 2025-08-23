import GitHubService from '../services/githubService.js';
import { getUserGitHubToken } from '../services/accountService.js';

class GitHubController {
    // 统一错误处理，包含网络异常 → 503
    respondByGitHubError(res, result, defaultMessage) {
        const networkCodes = ['ENOTFOUND','ECONNABORTED','ECONNRESET','ETIMEDOUT','EAI_AGAIN','ENETUNREACH'];
        if (result?.isNetwork || (result?.code && networkCodes.includes(result.code)) || /network/i.test(result?.error || '')) {
            return res.status(503).json({ error: 'GitHub网络不可用，请稍后重试' });
        }
        if (result?.error?.includes('Bad credentials') || result?.error?.includes('token')) {
            return res.status(401).json({ error: 'GitHub连接已过期，请重新连接GitHub账户' });
        }
        if (result?.error?.includes('rate limit')) {
            return res.status(429).json({ error: 'GitHub API请求频率过高，请稍后重试' });
        }
        if (result?.status === 404 || result?.error?.includes('Not Found')) {
            return res.status(404).json({ error: 'GitHub服务暂时不可用' });
        }
        return res.status(500).json({ error: result?.error || defaultMessage });
    }

    // 获取用户信息
    async getUserInfo(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            GitHubService.initialize(githubToken);
            const result = await GitHubService.getUserInfo();
            
            if (result.success) {
                res.json({ success: true, user: result.user });
            } else {
                this.respondByGitHubError(res, result, '获取用户信息失败');
            }
        } catch (error) {
            console.error('获取GitHub用户信息失败:', error);
            res.status(500).json({ error: '获取用户信息失败' });
        }
    }

    // 获取用户仓库列表
    async getUserRepos(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { page = 1, per_page = 30 } = req.query;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getUserRepos(page, per_page);
            
            if (result.success) {
                res.json(result.repos);
            } else {
                this.respondByGitHubError(res, result, '获取仓库列表失败');
            }
        } catch (error) {
            console.error('获取GitHub仓库列表失败:', error);
            res.status(500).json({ error: '获取仓库列表失败' });
        }
    }

    // 获取仓库详情
    async getRepoInfo(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoInfo(owner, repo);
            
            if (result.success) {
                res.json(result.repository);
            } else {
                this.respondByGitHubError(res, result, '获取仓库详情失败');
            }
        } catch (error) {
            console.error('获取仓库详情失败:', error);
            res.status(500).json({ error: '获取仓库详情失败' });
        }
    }

    // 获取仓库的Milestones
    async getRepoMilestones(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            const { state = 'all' } = req.query;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoMilestones(owner, repo, state);
            
            if (result.success) {
                res.json(result.milestones);
            } else {
                this.respondByGitHubError(res, result, '获取Milestones失败');
            }
        } catch (error) {
            console.error('获取Milestones失败:', error);
            res.status(500).json({ error: '获取Milestones失败' });
        }
    }

    // 获取仓库的Issues
    async getRepoIssues(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            const { state = 'all', page = 1 } = req.query;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoIssues(owner, repo, state, page);
            
            if (result.success) {
                res.json(result.issues);
            } else {
                this.respondByGitHubError(res, result, '获取Issues失败');
            }
        } catch (error) {
            console.error('获取Issues失败:', error);
            res.status(500).json({ error: '获取Issues失败' });
        }
    }

    // 获取仓库的Contributors
    async getRepoContributors(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoContributors(owner, repo);
            
            if (result.success) {
                res.json(result.contributors);
            } else {
                this.respondByGitHubError(res, result, '获取Contributors失败');
            }
        } catch (error) {
            console.error('获取Contributors失败:', error);
            res.status(500).json({ error: '获取Contributors失败' });
        }
    }

    // 获取仓库的Commits
    async getRepoCommits(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            const { page = 1 } = req.query;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoCommits(owner, repo, page);
            
            if (result.success) {
                res.json(result.commits);
            } else {
                this.respondByGitHubError(res, result, '获取Commits失败');
            }
        } catch (error) {
            console.error('获取Commits失败:', error);
            res.status(500).json({ error: '获取Commits失败' });
        }
    }

    // 获取仓库的Pull Requests
    async getRepoPullRequests(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            const { state = 'all', page = 1 } = req.query;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoPullRequests(owner, repo, state, page);
            
            if (result.success) {
                res.json(result.pullRequests);
            } else {
                this.respondByGitHubError(res, result, '获取Pull Requests失败');
            }
        } catch (error) {
            console.error('获取Pull Requests失败:', error);
            res.status(500).json({ error: '获取Pull Requests失败' });
        }
    }

    // 获取仓库完整统计信息
    async getRepoStats(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            GitHubService.initialize(githubToken);
            const result = await GitHubService.getRepoStats(owner, repo);
            
            if (result.success) {
                res.json(result.stats);
            } else {
                this.respondByGitHubError(res, result, '获取仓库统计信息失败');
            }
        } catch (error) {
            console.error('获取仓库统计信息失败:', error);
            res.status(500).json({ error: '获取仓库统计信息失败' });
        }
    }

    // 获取用户贡献分数
    async getContributionScore(req, res) {
        try {
            // 从JWT token中获取用户名
            const username = req.user?.username;
            if (!username) {
                return res.status(401).json({ error: '未授权，请先登录系统' });
            }

            // 从数据库获取GitHub token
            const githubToken = await getUserGitHubToken(username);
            if (!githubToken) {
                return res.status(401).json({ error: '未连接GitHub，请先连接GitHub账户' });
            }

            const { owner, repo } = req.params;
            const { username: targetUsername } = req.params;
            
            GitHubService.initialize(githubToken);
            
            // 获取仓库统计信息
            const statsResult = await GitHubService.getRepoStats(owner, repo);
            if (!statsResult.success) {
                return res.status(500).json({ error: statsResult.error });
            }

            // 获取用户信息
            const userResult = await GitHubService.getUserInfo();
            if (!userResult.success) {
                return res.status(500).json({ error: userResult.error });
            }

            // 计算贡献分数
            const score = GitHubService.calculateContributionScore(userResult.user, statsResult.stats);
            
            res.json({ 
                success: true, 
                score,
                user: userResult.user,
                stats: {
                    commits: statsResult.stats.commits.length,
                    issues: statsResult.stats.issues.length,
                    pullRequests: statsResult.stats.pullRequests.length
                }
            });
        } catch (error) {
            console.error('计算贡献分数失败:', error);
            res.status(500).json({ error: '计算贡献分数失败' });
        }
    }
}

export default new GitHubController();
