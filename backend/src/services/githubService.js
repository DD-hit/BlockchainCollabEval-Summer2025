import { Octokit } from 'octokit';

class GitHubService {
    constructor() {
        this.octokit = null;
    }

    // 初始化Octokit实例
    initialize(token) {
        this.octokit = new Octokit({
            auth: token
        });
    }

    // 获取用户信息
    async getUserInfo() {
        try {
            const { data: user } = await this.octokit.rest.users.getAuthenticated();
            return { success: true, user };
        } catch (error) {
            console.error('获取GitHub用户信息失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取用户仓库列表
    async getUserRepos(page = 1, per_page = 30) {
        try {
            const { data: repos } = await this.octokit.rest.repos.listForAuthenticatedUser({
                per_page: parseInt(per_page),
                page: parseInt(page),
                sort: 'updated',
                direction: 'desc'
            });
            return { success: true, repos };
        } catch (error) {
            console.error('获取GitHub仓库列表失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库详情
    async getRepoInfo(owner, repo) {
        try {
            const { data: repository } = await this.octokit.rest.repos.get({
                owner,
                repo
            });
            return { success: true, repository };
        } catch (error) {
            console.error('获取仓库详情失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库的Milestones
    async getRepoMilestones(owner, repo, state = 'all') {
        try {
            const { data: milestones } = await this.octokit.rest.issues.listMilestones({
                owner,
                repo,
                state,
                per_page: 100
            });
            return { success: true, milestones };
        } catch (error) {
            console.error('获取Milestones失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库的Issues
    async getRepoIssues(owner, repo, state = 'all', page = 1) {
        try {
            const { data: issues } = await this.octokit.rest.issues.listForRepo({
                owner,
                repo,
                state,
                per_page: 30,
                page: parseInt(page),
                sort: 'updated',
                direction: 'desc'
            });
            // GitHub 的 PR 也是 Issue 的一种（有 pull_request 字段）。
            // 这里返回“纯 Issue”，需要剔除带 pull_request 字段的条目。
            const pureIssues = Array.isArray(issues)
                ? issues.filter((it) => !(it && it.pull_request))
                : [];
            return { success: true, issues: pureIssues };
        } catch (error) {
            console.error('获取Issues失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库的Contributors（并集：提交者 ∪ 协作者 ∪ PR作者 ∪ Issue作者）
    async getRepoContributors(owner, repo) {
        try {
            const { data: contributors } = await this.octokit.rest.repos.listContributors({
                owner,
                repo,
                per_page: 100
            });

            // 获取近52周的贡献统计，尽量与GitHub页面一致
            const fetchContribStatsWithRetry = async (retries = 5, delayMs = 1500) => {
                for (let i = 0; i < retries; i++) {
                    const resp = await this.octokit.rest.repos.getContributorsStats({ owner, repo });
                    // 202 表示正在生成统计，等待后重试
                    if (resp.status === 202) {
                        await new Promise(r => setTimeout(r, delayMs));
                        continue;
                    }
                    return resp;
                }
                return null;
            };

            let contributorsStats = null;
            try {
                const statsResp = await fetchContribStatsWithRetry();
                contributorsStats = statsResp && statsResp.data ? statsResp.data : null;
            } catch (statsError) {
                // 忽略统计错误，仍返回基础contributors
                console.warn('获取Contributors统计信息失败:', statsError?.message || statsError);
            }

            // 将统计信息合并到contributors中
            const loginToStats = new Map();
            if (Array.isArray(contributorsStats)) {
                contributorsStats.forEach(item => {
                    const login = item?.author?.login;
                    if (!login) return;
                    const totals = item?.weeks?.reduce((acc, w) => {
                        acc.additions += w.a || 0;
                        acc.deletions += w.d || 0;
                        acc.commits += w.c || 0;
                        return acc;
                    }, { additions: 0, deletions: 0, commits: 0 });
                    loginToStats.set(login, { additions: totals.additions, deletions: totals.deletions, commits: totals.commits, weeks: item.weeks || [] });
                });
            }

            const enriched = contributors.map(c => {
                const extra = loginToStats.get(c.login) || { additions: 0, deletions: 0, commits: c.contributions, weeks: [] };
                return { ...c, additions: extra.additions, deletions: extra.deletions, weekly: extra.weeks };
            });

            // 追加：协作者、PR作者、Issue作者（去重并补齐）
            const loginToContributor = new Map(enriched.map((c) => [c.login, c]));

            const safeFetch = async (fn, fallback = []) => {
                try {
                    const resp = await fn();
                    return Array.isArray(resp?.data) ? resp.data : fallback;
                } catch (e) {
                    // 权限不足或API限制等错误忽略，尽量返回已有数据
                    return fallback;
                }
            };

            const [collaborators, pulls, issues] = await Promise.all([
                safeFetch(() => this.octokit.rest.repos.listCollaborators({ owner, repo, per_page: 100 })),
                safeFetch(() => this.octokit.rest.pulls.list({ owner, repo, state: 'all', per_page: 100 })),
                safeFetch(() => this.octokit.rest.issues.listForRepo({ owner, repo, state: 'all', per_page: 100 }))
            ]);

            const candidateUsers = [];
            if (Array.isArray(collaborators)) {
                collaborators.forEach((u) => u && candidateUsers.push(u));
            }
            if (Array.isArray(pulls)) {
                pulls.forEach((pr) => pr?.user && candidateUsers.push(pr.user));
            }
            if (Array.isArray(issues)) {
                issues
                    .filter((it) => !(it && it.pull_request)) // 仅纯 Issue，避免与 PR 重复
                    .forEach((it) => it?.user && candidateUsers.push(it.user));
            }

            for (const u of candidateUsers) {
                const login = u?.login;
                if (!login || loginToContributor.has(login)) continue;
                // 为非提交者补齐一个条目，计数为0
                loginToContributor.set(login, {
                    login,
                    id: u.id,
                    avatar_url: u.avatar_url,
                    html_url: u.html_url,
                    contributions: 0,
                    additions: 0,
                    deletions: 0,
                    weekly: []
                });
            }

            const merged = Array.from(loginToContributor.values());
            return { success: true, contributors: merged };
        } catch (error) {
            console.error('获取Contributors失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库的Commits
    async getRepoCommits(owner, repo, page = 1) {
        try {
            const { data: commits } = await this.octokit.rest.repos.listCommits({
                owner,
                repo,
                per_page: 30,
                page: parseInt(page)
            });
            
            // 获取每个commit的详细信息以包含stats
            const commitsWithStats = await Promise.all(
                commits.map(async (commit) => {
                    try {
                        const { data: commitDetail } = await this.octokit.rest.repos.getCommit({
                            owner,
                            repo,
                            ref: commit.sha
                        });
                        return {
                            ...commit,
                            stats: commitDetail.stats
                        };
                    } catch (error) {
                        console.warn(`获取commit ${commit.sha} 详细信息失败:`, error);
                        return commit;
                    }
                })
            );
            
            // 获取代码频率（每周的 additions/deletions）与贡献者统计，使前端更接近GitHub图表
            let codeFrequency = [];
            try {
                const freqResp = await this.octokit.rest.repos.getCodeFrequencyStats({ owner, repo });
                // freqResp.data: [weekTimestamp, additions, deletions]
                codeFrequency = Array.isArray(freqResp.data) ? freqResp.data : [];
            } catch (freqErr) {
                console.warn('获取代码频率统计失败:', freqErr?.message || freqErr);
            }

            return { success: true, commits: commitsWithStats, codeFrequency };
        } catch (error) {
            console.error('获取Commits失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库的Pull Requests
    async getRepoPullRequests(owner, repo, state = 'all', page = 1) {
        try {
            const { data: pullRequests } = await this.octokit.rest.pulls.list({
                owner,
                repo,
                state,
                per_page: 30,
                page: parseInt(page),
                sort: 'updated',
                direction: 'desc'
            });
            return { success: true, pullRequests };
        } catch (error) {
            console.error('获取Pull Requests失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 获取仓库完整统计信息
    async getRepoStats(owner, repo) {
        try {
            // 并行获取所有数据
            const [repoInfo, milestones, issues, contributors, commits, pullRequests] = await Promise.all([
                this.octokit.rest.repos.get({ owner, repo }),
                this.octokit.rest.issues.listMilestones({ owner, repo, state: 'all', per_page: 100 }),
                this.octokit.rest.issues.listForRepo({ owner, repo, state: 'all', per_page: 30 }),
                this.octokit.rest.repos.listContributors({ owner, repo, per_page: 100 }),
                this.octokit.rest.repos.listCommits({ owner, repo, per_page: 30 }),
                this.octokit.rest.pulls.list({ owner, repo, state: 'all', per_page: 30 })
            ]);

            const stats = {
                repository: repoInfo.data,
                milestones: milestones.data,
                issues: issues.data,
                contributors: contributors.data,
                commits: commits.data,
                pullRequests: pullRequests.data
            };

            return { success: true, stats };
        } catch (error) {
            console.error('获取仓库统计信息失败:', error);
            return { 
                success: false, 
                error: error && error.message ? error.message : 'GitHub请求失败',
                status: error && (error.status || error.response?.status),
                code: error && (error.code || error.cause?.code),
                isNetwork: !!(error && !error.status && (!error.response || error.code))
            };
        }
    }

    // 计算贡献分数（示例算法）
    calculateContributionScore(user, stats) {
        let score = 0;
        
        // 根据commits数量计算分数
        const userCommits = stats.commits.filter(commit => 
            commit.author && commit.author.login === user.login
        ).length;
        score += userCommits * 10;

        // 根据issues数量计算分数
        const userIssues = stats.issues.filter(issue => 
            issue.user && issue.user.login === user.login
        ).length;
        score += userIssues * 5;

        // 根据pull requests数量计算分数
        const userPRs = stats.pullRequests.filter(pr => 
            pr.user && pr.user.login === user.login
        ).length;
        score += userPRs * 15;

        return score;
    }
}

export default new GitHubService();
