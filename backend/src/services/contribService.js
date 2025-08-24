import { pool } from '../../config/database.js';

export class ContribService {

    static async isUserBound(username) {
        const [rows] = await pool.execute(
            'SELECT github_login FROM user WHERE username = ?',
            [username]
        );
        if (rows.length === 0) return { exists: false, github_login: null };
        return { exists: true, github_login: rows[0].github_login };
    }

    // 写入/更新一轮的基础分：同步写 github_login 与（若绑定）username
    static async insertBaseScores(roundId, items) {
        if (!Array.isArray(items) || items.length === 0) {
            return { affected: 0 };
        }

        let affected = 0;
        for (const it of items) {
            const githubLogin = it.github_login;
            if (!githubLogin) continue;

            const [userRows] = await pool.execute(
                'SELECT username, address FROM user WHERE github_login = ?',
                [githubLogin]
            );
            const username = userRows.length > 0 ? userRows[0].username : null;
            const address = userRows.length > 0 ? userRows[0].address : null;

            const codeScore = it.code_score ?? 0;
            const prScore = it.pr_score ?? 0;
            const reviewScore = it.review_score ?? 0;
            const issueScore = it.issue_score ?? 0;
            const baseScore = it.base_score ?? 0;
            const rawJson = JSON.stringify(it.raw_json || {});

            await pool.execute(
                `INSERT INTO contrib_base_scores
                 (round_id, username, github_login, address, code_score, pr_score, review_score, issue_score, base_score, raw_json)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   username = VALUES(username),
                   address = VALUES(address),
                   code_score = VALUES(code_score),
                   pr_score = VALUES(pr_score),
                   review_score = VALUES(review_score),
                   issue_score = VALUES(issue_score),
                   base_score = VALUES(base_score),
                   raw_json = VALUES(raw_json)`,
                [roundId, username, githubLogin, address, codeScore, prScore, reviewScore, issueScore, baseScore, rawJson]
            );
            affected++;
        }
        return { affected };
    }

    // 仅允许已绑定用户提交互评；target 使用 github_login 标识
    static async submitPeerVotes(roundId, reviewerUsername, votes) {
        const bindInfo = await this.isUserBound(reviewerUsername);
        if (!bindInfo.exists) {
            throw new Error('用户不存在');
        }
        if (!bindInfo.github_login) {
            const e = new Error('未绑定GitHub账号，无法参与互评');
            e.code = 'NOT_BOUND';
            throw e;
        }

        if (!Array.isArray(votes) || votes.length === 0) {
            return { affected: 0 };
        }

        // 校验 target 存在于本轮基础分
        const [baseRows] = await pool.execute(
            'SELECT github_login FROM contrib_base_scores WHERE round_id = ?',
            [roundId]
        );
        const validTargets = new Set(baseRows.map(r => r.github_login));

        let affected = 0;
        for (const v of votes) {
            const target = v.target; // github_login
            const score = Number(v.score || 0);
            if (!target || !validTargets.has(target)) continue;
            if (score < 0 || score > 100) continue;

            await pool.execute(
                `INSERT INTO contrib_peer_votes (round_id, reviewer, target, score)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                [roundId, reviewerUsername, target, score]
            );
            affected++;
        }
        return { affected };
    }
}


