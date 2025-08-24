import { pool } from '../../config/database.js';
import { GitHubContribOnchainService } from '../services/githubContribOnchainService.js';
import { NotificationService } from '../services/notificationService.js';
import { TransactionService } from '../services/transactionService.js';
import { AccountService, getUserGitHubToken } from '../services/accountService.js';
import GitHubService from '../services/githubService.js';
import { ContribService } from '../services/contribService.js';

// 从 contrib_base_scores 读取本轮已计算的基础分与明细
async function readBaseScoresByRound(roundId) {
    const [rows] = await pool.execute(
        `SELECT username, github_login, address, 
                CAST(code_score AS DECIMAL(6,2)) AS code_score,
                CAST(pr_score AS DECIMAL(6,2)) AS pr_score,
                CAST(review_score AS DECIMAL(6,2)) AS review_score,
                CAST(issue_score AS DECIMAL(6,2)) AS issue_score,
                CAST(base_score AS DECIMAL(6,2)) AS base_score
         FROM contrib_base_scores WHERE round_id = ?`,
        [roundId]
    );
    return rows.map(r => ({
        username: r.username,
        github_login: r.github_login,
        address: r.address,
        code: Math.max(0, Math.min(100, Math.round(Number(r.code_score || 0)))),
        pr: Math.max(0, Math.min(100, Math.round(Number(r.pr_score || 0)))),
        review: Math.max(0, Math.min(100, Math.round(Number(r.review_score || 0)))),
        issue: Math.max(0, Math.min(100, Math.round(Number(r.issue_score || 0)))),
        base: Math.max(0, Math.min(100, Math.round(Number(r.base_score || 0))))
    }));
}

// 将本轮最终分写入 contrib_final_scores（若已存在则更新）
async function saveFinalScores(roundId, items) {
    for (const it of items) {
        // 通过地址查 username
        const [u] = await pool.execute('SELECT username FROM user WHERE address = ? LIMIT 1', [it.address]);
        const username = u.length > 0 ? u[0].username : null;
        if (!username) continue;
        await pool.execute(
            `INSERT INTO contrib_final_scores (round_id, username, base_score, peer_score, final_score)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE base_score=VALUES(base_score), peer_score=VALUES(peer_score), final_score=VALUES(final_score)`,
            [roundId, username, Number(it.base?.base) || 0, Number(it.peerNorm) || 0, Number(it.finalScore) || 0]
        );
    }
}

export const startContributionRound = async (req, res) => {
    try {
        const { repoId, adminAddress, adminPassword } = req.body;
        if (!repoId || !adminAddress || !adminPassword) {
            return res.status(400).json({ success: false, message: '缺少参数' });
        }

        // 解密管理员私钥（基于登录用户 + 密码）
        const username = req.user?.username;
        if (!username) return res.status(401).json({ success: false, message: '未登录' });
        const keyInfo = await AccountService.getPrivateKey(username, adminPassword);
        const adminPrivateKey = keyInfo?.privateKey;
        const derivedAddress = keyInfo?.address;
        if (!adminPrivateKey) return res.status(403).json({ success: false, message: '密码错误，无法解密私钥' });
        if (derivedAddress && derivedAddress.toLowerCase() !== adminAddress.toLowerCase()) {
            return res.status(400).json({ success: false, message: '管理员地址与账户不匹配' });
        }

        // 1) 生成新区间：以上一次该仓库的 end_ts_ms 作为新的 start
        const nowMs = Date.now();
        const [lastRows] = await pool.execute(
            'SELECT id, end_ts_ms FROM contrib_rounds WHERE repoId = ? ORDER BY end_ts_ms DESC LIMIT 1',
            [repoId]
        );
        const start_ts_ms = lastRows.length > 0 ? Number(lastRows[0].end_ts_ms) : 0;
        const end_ts_ms = nowMs;

        // 1.1) 新建轮次（自增ID）
        const initiator = req.user?.username || 'system';
        const [ins] = await pool.execute(
            `INSERT INTO contrib_rounds (repoId, initiator, start_ts_ms, end_ts_ms, status)
             VALUES (?, ?, ?, ?, 'open')`,
            [repoId, initiator, start_ts_ms, end_ts_ms]
        );
        const roundId = ins.insertId;

        // 2) 严格按规则自动计算并写入基础分
        try {
            const token = await getUserGitHubToken(initiator);
            if (!token) {
                return res.status(403).json({ success: false, message: '请先在个人中心绑定 GitHub 并授权', data: { roundId } });
            }
            GitHubService.initialize(token);

            const [owner, repo] = repoId.split('/');
            const startMs = start_ts_ms; const endMs = end_ts_ms;
            const inRangeMs = (iso) => { const t = new Date(iso).getTime(); return t >= startMs && t <= endMs; };

            // 参与者
            const contribResp = await GitHubService.getRepoContributors(owner, repo);
            const contributors = Array.isArray(contribResp?.contributors) ? contribResp.contributors : [];
            const logins = contributors.map(c => c.login);

            // 收集 commits（带 stats）
            const commitsResp = await GitHubService.getRepoCommits(owner, repo, 1);
            const commits = Array.isArray(commitsResp?.commits) ? commitsResp.commits : commitsResp?.commitsWithStats || commitsResp || [];
            const codeRaw = new Map(); // login -> ln(1+|add+del|) + commitCount
            for (const c of commits || []) {
                const authorLogin = c.author?.login || c.commit?.author?.name;
                const dateIso = c.commit?.author?.date;
                if (!authorLogin || !dateIso || !inRangeMs(dateIso)) continue;
                const adds = c.stats?.additions || 0;
                const dels = c.stats?.deletions || 0;
                const sum = (adds + dels);
                const prev = codeRaw.get(authorLogin) || { sum: 0, cnt: 0 };
                prev.sum += sum; prev.cnt += 1;
                codeRaw.set(authorLogin, prev);
            }
            const codeMetric = new Map();
            for (const login of logins) {
                const v = codeRaw.get(login) || { sum: 0, cnt: 0 };
                const raw = Math.log(1 + v.sum) + v.cnt;
                codeMetric.set(login, raw);
            }
            const arrCode = Array.from(codeMetric.values());
            const p95 = (xs) => {
                if (!xs.length) return 1;
                const a = xs.slice().sort((a,b)=>a-b);
                const idx = Math.floor(0.95 * (a.length-1));
                return Math.max(1, a[idx]);
            };
            const codeP95 = p95(arrCode);
            const codeScore = new Map();
            for (const [login, val] of codeMetric.entries()) {
                const clipped = Math.min(val, codeP95);
                const norm = Math.max(0, Math.min(1, clipped / codeP95));
                codeScore.set(login, Math.round(norm * 100));
            }

            // PR（创建 + 2×合并）
            const prsResp = await GitHubService.getRepoPullRequests(owner, repo, 'all', 1);
            const prs = Array.isArray(prsResp?.pullRequests) ? prsResp.pullRequests : [];
            const prRaw = new Map();
            for (const pr of prs) {
                const login = pr.user?.login; if (!login) continue;
                const created = pr.created_at && inRangeMs(pr.created_at) ? 1 : 0;
                const merged = pr.merged_at && inRangeMs(pr.merged_at) ? 1 : 0;
                prRaw.set(login, (prRaw.get(login) || 0) + created + 2*merged);
            }
            const prArr = Array.from(prRaw.values());
            const prP95 = p95(prArr);
            const prScore = new Map();
            for (const login of logins) {
                const raw = prRaw.get(login) || 0;
                const clipped = Math.min(raw, prP95 || 1);
                prScore.set(login, Math.round((clipped / Math.max(1, prP95)) * 100));
            }

            // Review：按 PR 的 reviews 计数（若 API 失败则为 0）
            const reviewRaw = new Map();
            try {
                if (GitHubService.octokit && prs.length) {
                    for (const pr of prs) {
                        const resp = await GitHubService.octokit.rest.pulls.listReviews({ owner, repo, pull_number: pr.number, per_page: 100 });
                        const reviews = Array.isArray(resp?.data) ? resp.data : [];
                        for (const rv of reviews) {
                            const who = rv.user?.login; const at = rv.submitted_at || rv.submittedAt || rv.submitted_at;
                            if (!who || !at || !inRangeMs(at)) continue;
                            reviewRaw.set(who, (reviewRaw.get(who) || 0) + 1);
                        }
                    }
                }
            } catch (e) { /* 忽略，默认0 */ }
            const reviewArr = Array.from(reviewRaw.values());
            const reviewP95 = p95(reviewArr);
            const reviewScore = new Map();
            for (const login of logins) {
                const raw = reviewRaw.get(login) || 0;
                const clipped = Math.min(raw, reviewP95 || 1);
                reviewScore.set(login, Math.round((clipped / Math.max(1, reviewP95)) * 100));
            }

            // Issue：被指派且按时关闭；优先以里程碑截止时间判定按时，其次回退到 SLA；支持多指派（assignees）
            const SLA_DAYS = parseInt(process.env.CONTRIB_SLA_DAYS || '7', 10);
            const issuesResp = await GitHubService.getRepoIssues(owner, repo, 'all', 1);
            const issues = Array.isArray(issuesResp?.issues) ? issuesResp.issues : [];
            const issueRaw = new Map();
            for (const iss of issues) {
                // 取所有被指派人：优先 assignees 数组，兼容单个 assignee 字段
                const list = [];
                if (Array.isArray(iss.assignees)) {
                    for (const a of iss.assignees) {
                        if (a && a.login) list.push(a.login);
                    }
                }
                if (iss.assignee && iss.assignee.login) list.push(iss.assignee.login);
                const uniqueLogins = Array.from(new Set(list));
                if (uniqueLogins.length === 0) continue;

                // 仅统计在本轮区间内关闭，且“按时”的 Issue（按里程碑 due_on 或 SLA 判定）
                if (!inRangeMs(iss.closed_at || iss.closedAt)) continue;
                const createdMs = iss.created_at ? new Date(iss.created_at).getTime() : null;
                const closedMs = new Date(iss.closed_at).getTime();

                // 优先：若有里程碑截止时间，则按 closedMs <= dueOnMs 判定
                let onTime = false;
                const dueOnIso = iss?.milestone?.due_on || iss?.milestone?.dueOn;
                if (dueOnIso) {
                    const dueOnMs = new Date(dueOnIso).getTime();
                    if (!isNaN(dueOnMs)) {
                        onTime = closedMs <= dueOnMs;
                    }
                }
                // 回退：无 due_on 时，用 SLA 天数（创建→关闭耗时不超过 SLA）
                if (!onTime && createdMs != null) {
                    onTime = (closedMs - createdMs) <= SLA_DAYS * 86400000;
                }
                if (!onTime) continue;

                for (const login of uniqueLogins) {
                    issueRaw.set(login, (issueRaw.get(login) || 0) + 1);
                }
            }
            const issueArr = Array.from(issueRaw.values());
            const issueP95 = p95(issueArr);
            const issueScore = new Map();
            for (const login of logins) {
                const raw = issueRaw.get(login) || 0;
                const clipped = Math.min(raw, issueP95 || 1);
                issueScore.set(login, Math.round((clipped / Math.max(1, issueP95)) * 100));
            }

            // 组合 Base = (0.5*Code + 0.2*PR + 0.2*Review + 0.1*Issue)*100 已经各自0..100，先转到0..1再合成
            const items = logins.map(login => {
                const code_s = (codeScore.get(login) || 0);
                const pr_s = (prScore.get(login) || 0);
                const review_s = (reviewScore.get(login) || 0);
                const issue_s = (issueScore.get(login) || 0);
                const base = (0.5*(code_s/100) + 0.2*(pr_s/100) + 0.2*(review_s/100) + 0.1*(issue_s/100))*100;
                return {
                    github_login: login,
                    code_score: Math.round(code_s),
                    pr_score: Math.round(pr_s),
                    review_score: Math.round(review_s),
                    issue_score: Math.round(issue_s),
                    base_score: Math.round(base),
                    raw_json: {
                        code_raw: codeMetric.get(login) || 0,
                        pr_raw: prRaw.get(login) || 0,
                        review_raw: reviewRaw.get(login) || 0,
                        issue_raw: issueRaw.get(login) || 0
                    }
                };
            });

            await ContribService.insertBaseScores(roundId, items);
        } catch (calcErr) {
            return res.status(500).json({ success: false, message: `基础分计算失败: ${calcErr.message}`, data: { roundId } });
        }

        const baseItems = await readBaseScoresByRound(roundId);
        if (!Array.isArray(baseItems) || baseItems.length === 0) {
            return res.status(400).json({ success: false, message: '本轮未找到基础分，请先写入 contrib_base_scores', data: { roundId } });
        }

        // 若有成员缺少链上地址则报错（需要在个人中心绑定）
        const missingAddr = baseItems.filter(i => !i.address);
        if (missingAddr.length > 0) {
            const names = missingAddr.map(i => i.username || i.github_login).join(',');
            return res.status(400).json({ success: false, message: `以下成员未绑定链上地址: ${names}` });
        }

        // 收集 raters/targets/users 列表
        const users = baseItems.map(i => i.address);
        const raters = users; // 全员互评
        const targets = users; // 全员为目标

        // 单人成员（或<2人）直接按基础分返回排行榜，不部署合约
        if (users.length < 2) {
            const scores = baseItems.map(i => ({
                address: i.address,
                finalScore: Number(i.base) || 0,
                peerNorm: 0,
                base: { code: i.code, pr: i.pr, review: i.review, issue: i.issue, base: i.base }
            }));

            // 记录本轮最终分，便于累计展示
            await saveFinalScores(roundId, scores);
            return res.json({
                success: true,
                message: '成员不足2人，直接按基础分作为最终贡献度返回',
                data: { roundId, contractAddress: null, users, scores, interval: { start_ts_ms, end_ts_ms } }
            });
        }

        // 组装基础明细数组（solidity类型要求）
        const addrArr = users;
        const codeArr = baseItems.map(i => i.code);
        const prArr = baseItems.map(i => i.pr);
        const reviewArr = baseItems.map(i => i.review);
        const issueArr = baseItems.map(i => i.issue);
        const baseArr = baseItems.map(i => i.base);
        let baseNormArr = baseItems.map(i => i.base); // 用基础分作为 baseNorm
        // 防止全为0导致合约 revert(sum baseNorm=0)
        const baseNormSum = baseNormArr.reduce((s, v) => s + (Number(v) || 0), 0);
        if (baseNormSum === 0) {
            baseNormArr = new Array(users.length).fill(1);
        }

        // 3) 部署合约
        const contractAddress = await GitHubContribOnchainService.deployContract(adminAddress, adminPrivateKey);

        // 4) 上链基础数据
        await GitHubContribOnchainService.setRaters(contractAddress, adminAddress, adminPrivateKey, raters);
        await GitHubContribOnchainService.setTargets(contractAddress, adminAddress, adminPrivateKey, targets);
        await GitHubContribOnchainService.setBaseDetails(
            contractAddress,
            adminAddress,
            adminPrivateKey,
            addrArr, codeArr, prArr, reviewArr, issueArr, baseArr, baseNormArr
        );

        // 5) 存交易记录：保存本轮部署信息（代替写入 contrib_rounds.contract_address）
        try {
            await TransactionService.createTransaction({
                transactionHash: null,
                type: 'contrib_round',
                username: req.user?.username || 'system',
                address: adminAddress,
                subtaskId: null,
                fileId: null,
                contractAddress: contractAddress,
                description: `部署GitHub贡献度合约: repo=${repoId}, round=${roundId}`,
                details: { repoId, roundId, users },
                blockNumber: null,
                gasUsed: null,
                status: 'success'
            });
        } catch (e) {
            // 记录失败不影响主流程
        }

        // 6) 通知所有参与者去评分（新合约专用通知类型）
        await NotificationService.addGitHubContribRoundNotifications(
            roundId,
            repoId,
            contractAddress || null,
            req.user?.username || 'system'
        );

        res.json({ success: true, message: '轮次已启动并部署合约', data: { roundId, contractAddress, users, interval: { start_ts_ms, end_ts_ms } } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitPeerVotesOnchain = async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const voterAddress = req.body?.address;
        const password = req.body?.password;
        const votesBody = Array.isArray(req.body?.votes) ? req.body.votes : [];
        const scoresBody = req.body?.scores && typeof req.body.scores === 'object' ? req.body.scores : null; // { login: { base: number } }

        if (!contractAddress || !password) {
            return res.status(400).json({ success: false, message: '缺少参数' });
        }
        if (!votesBody.length && !scoresBody) return res.status(400).json({ success: false, message: '缺少投票明细' });

        let to = [];
        let pts = [];

        if (votesBody.length) {
            to = votesBody.map(v => v.targetAddress);
            pts = votesBody.map(v => Number(v.points));
        } else if (scoresBody) {
            // 将 {login: {base}} 转换为 {address, points}
            // 先解析该合约对应的 roundId，以限定参与者范围
            let rid = null;
            const [ridRows] = await pool.execute(
                `SELECT JSON_UNQUOTE(JSON_EXTRACT(details, '$.roundId')) AS rid
                 FROM transactions WHERE type='contrib_round' AND contractAddress = ?
                 ORDER BY id DESC LIMIT 1`,
                [contractAddress]
            );
            if (ridRows.length > 0) {
                const rv = ridRows[0].rid; rid = rv ? Number(rv) : null;
            }
            for (const rawLogin of Object.keys(scoresBody)) {
                const login = String(rawLogin || '').toLowerCase();
                const base = Number(scoresBody[rawLogin]?.base || 0);
                if (!isFinite(base)) continue;
                let addr = null;
                if (rid) {
                    const [rows] = await pool.execute(
                        `SELECT u.address FROM contrib_base_scores b JOIN user u ON u.github_login = b.github_login
                         WHERE b.round_id = ? AND LOWER(b.github_login) = ? LIMIT 1`,
                        [rid, login]
                    );
                    if (rows && rows.length > 0) addr = rows[0].address;
                }
                if (!addr) {
                    const [rows2] = await pool.execute(
                        `SELECT address FROM user WHERE LOWER(github_login) = ? LIMIT 1`, [login]
                    );
                    if (rows2 && rows2.length > 0) addr = rows2[0].address;
                }
                if (addr) {
                    to.push(addr);
                    pts.push(Math.max(0, Math.min(100, Math.round(base))));
                }
            }
            if (to.length === 0) return res.status(400).json({ success: false, message: '未找到有效的投票目标地址' });
        }

        // 解密当前用户私钥
        const username = req.user?.username;
        if (!username) return res.status(401).json({ success: false, message: '未登录' });
        const keyInfo = await AccountService.getPrivateKey(username, password);
        const privateKey = keyInfo?.privateKey;
        const address = voterAddress || keyInfo?.address;
        if (!privateKey) return res.status(403).json({ success: false, message: '密码错误，无法解密私钥' });

        const receipt = await GitHubContribOnchainService.submitVotes(contractAddress, address, privateKey, to, pts);
        res.json({ success: true, message: '投票已提交', data: { tx: receipt?.transactionHash } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const finalizeAndGetScores = async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const adminAddress = req.body?.adminAddress;
        const adminPassword = req.body?.adminPassword;
        const users = Array.isArray(req.body?.users) ? req.body.users : [];
        if (!contractAddress || !adminAddress || !adminPassword || users.length === 0) {
            return res.status(400).json({ success: false, message: '缺少参数' });
        }

        // 若全部投完则 finalize
        const progress = await GitHubContribOnchainService.getProgress(contractAddress);
        if (!progress.finalized) {
            if (progress.total === progress.voted && progress.total > 0) {
                const username = req.user?.username;
                if (!username) return res.status(401).json({ success: false, message: '未登录' });
                const keyInfo = await AccountService.getPrivateKey(username, adminPassword);
                const adminPrivateKey = keyInfo?.privateKey;
                const derivedAddress = keyInfo?.address;
                if (!adminPrivateKey) return res.status(403).json({ success: false, message: '密码错误，无法解密私钥' });
                if (derivedAddress && derivedAddress.toLowerCase() !== adminAddress.toLowerCase()) {
                    return res.status(400).json({ success: false, message: '管理员地址与账户不匹配' });
                }
                await GitHubContribOnchainService.finalize(contractAddress, adminAddress, adminPrivateKey);
            } else {
                return res.status(409).json({ success: false, message: '尚未全部完成评分', data: progress });
            }
        }

        // 拉取最终分与构成 & 写入 contrib_final_scores
        const scores = await GitHubContribOnchainService.getFinalScores(contractAddress, users);
        // roundId 通过 transactions.details.roundId 获取
        let rid = null;
        const [ridRows] = await pool.execute(
            `SELECT JSON_UNQUOTE(JSON_EXTRACT(details, '$.roundId')) AS rid
             FROM transactions WHERE type='contrib_round' AND contractAddress = ?
             ORDER BY id DESC LIMIT 1`,
            [contractAddress]
        );
        if (ridRows.length > 0) {
            const rv = ridRows[0].rid;
            rid = rv ? Number(rv) : null;
        }
        if (rid) {
            await saveFinalScores(rid, scores);
        }
        res.json({ success: true, message: '已完成并获取结果', data: { progress, scores } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getProgress = async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const p = await GitHubContribOnchainService.getProgress(contractAddress);
        res.json({ success: true, data: p });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 根据 repoId 获取最新一轮的排行榜（常驻显示用）
export const getLeaderboardByRepo = async (req, res) => {
    try {
        const { repoId, mode } = req.query;
        if (!repoId) return res.status(400).json({ success: false, message: '缺少 repoId' });
        const showMode = (mode || 'sum').toLowerCase();

        if (showMode === 'sum') {
            // 累计：按“成员”聚合。成员以 github_login 为主键，缺失则回退 username。
            // 为展示地址选取任意一个（MAX），通常同一成员只有一个地址。
            const [rows] = await pool.execute(
                `SELECT 
                    COALESCE(u.github_login, f.username)                 AS display_key,
                    MAX(u.github_login)                                   AS github_login,
                    MAX(u.address)                                        AS address,
                    SUM(f.final_score)                                    AS final_score,
                    SUM(f.peer_score)                                     AS peer_score,
                    SUM(f.base_score)                                     AS base_score
                 FROM contrib_final_scores f
                 JOIN contrib_rounds r ON r.id = f.round_id
                 LEFT JOIN user u ON u.username = f.username
                 WHERE r.repoId = ?
                 GROUP BY COALESCE(u.github_login, f.username)
                 ORDER BY final_score DESC`,
                [repoId]
            );
            const scores = rows.map(r => ({
                username: r.display_key, // 若有 github_login 则为其；否则为 username
                github_login: r.github_login || null,
                address: r.address || null,
                finalScore: Number(r.final_score) || 0,
                peerNorm: Number(r.peer_score) || 0,
                base: { base: Number(r.base_score) || 0, code: 0, pr: 0, review: 0, issue: 0 }
            }));
            return res.json({ success: true, data: { roundId: null, contractAddress: null, scores } });
        }

        // 否则返回“最新一轮”的结果
        const [roundRows] = await pool.execute(
            'SELECT id FROM contrib_rounds WHERE repoId = ? ORDER BY id DESC LIMIT 1',
            [repoId]
        );
        if (roundRows.length === 0) return res.json({ success: true, data: { roundId: null, scores: [] } });
        const roundId = roundRows[0].id;

        const baseItems = await readBaseScoresByRound(roundId);
        const users = baseItems.map(i => i.address).filter(Boolean);

        let scores = baseItems.map(i => ({
            username: i.username || null,
            github_login: i.github_login || null,
            address: i.address,
            finalScore: Number(i.base) || 0,
            peerNorm: 0,
            base: { code: i.code, pr: i.pr, review: i.review, issue: i.issue, base: i.base }
        }));

        // 尝试读链上最终结果（如果已经finalized）
        const [txRows] = await pool.execute(
            `SELECT contractAddress FROM transactions
             WHERE type='contrib_round' AND details IS NOT NULL
               AND JSON_EXTRACT(details, '$.roundId') = ?
             ORDER BY id DESC LIMIT 1`,
            [roundId]
        );
        const contractAddress = txRows.length > 0 ? (txRows[0].contractAddress || null) : null;
        if (contractAddress && users.length >= 2) {
            try {
                const progress = await GitHubContribOnchainService.getProgress(contractAddress);
                if (progress.finalized) {
                    scores = await GitHubContribOnchainService.getFinalScores(contractAddress, users);
                    // 补充 username/github_login
                    if (scores && scores.length > 0) {
                        const addrList = scores.map(s => s.address).filter(Boolean);
                        if (addrList.length > 0) {
                            const placeholders = addrList.map(() => '?').join(',');
                            const [urows] = await pool.execute(
                                `SELECT username, github_login, address FROM user WHERE address IN (${placeholders})`,
                                addrList
                            );
                            const map = new Map();
                            urows.forEach(r => map.set(r.address.toLowerCase(), { username: r.username, github_login: r.github_login }));
                            scores = scores.map(s => {
                                const m = s.address ? map.get(String(s.address).toLowerCase()) : null;
                                return { ...s, username: m?.username || null, github_login: m?.github_login || null };
                            });
                        }
                    }
                }
            } catch (e) {}
        }

        res.json({ success: true, data: { roundId, contractAddress, scores } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 用户每轮分数详情
export const getUserRounds = async (req, res) => {
    try {
        let { repoId, username, address } = req.query;
        if (!repoId) return res.status(400).json({ success: false, message: '缺少 repoId' });

        if (!username && address) {
            const [u] = await pool.execute('SELECT username FROM user WHERE address = ? LIMIT 1', [address]);
            if (u.length > 0) username = u[0].username;
        }
        if (!username) return res.status(400).json({ success: false, message: '缺少 username 或 address' });

        const [rows] = await pool.execute(
            `SELECT r.id AS roundId,
                    FROM_UNIXTIME(r.start_ts_ms/1000) AS start_at,
                    FROM_UNIXTIME(r.end_ts_ms/1000)   AS end_at,
                    f.base_score, f.peer_score, f.final_score
             FROM contrib_rounds r
             JOIN contrib_final_scores f ON f.round_id = r.id AND f.username = ?
             WHERE r.repoId = ?
             ORDER BY r.end_ts_ms DESC`,
            [username, repoId]
        );

        // 可选：附加基础分明细（code/pr/review/issue）
        for (const it of rows) {
            const [b] = await pool.execute(
                `SELECT code_score, pr_score, review_score, issue_score, base_score
                 FROM contrib_base_scores WHERE round_id = ? AND username = ? LIMIT 1`,
                [it.roundId, username]
            );
            if (b.length > 0) {
                it.code_score = b[0].code_score;
                it.pr_score = b[0].pr_score;
                it.review_score = b[0].review_score;
                it.issue_score = b[0].issue_score;
            }
        }

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


