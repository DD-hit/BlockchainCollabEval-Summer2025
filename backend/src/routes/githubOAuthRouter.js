import express from 'express';
import jwt from 'jsonwebtoken';
import { encryptToken } from '../utils/encryption.js';
import { updateUserGitHubToken, updateUserGitHubIdentity } from '../services/accountService.js';


const router = express.Router();

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    console.warn('WARNING: GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not defined. GitHub OAuth will not work.');
}

const getScheme = (req) => (req.headers['x-forwarded-proto'] || req.protocol || 'http');
const getHost = (req) => (req.headers['x-forwarded-host'] || req.headers['host']);
const getFrontendBaseUrl = (req) => {
    if (process.env.FRONTEND_BASE_URL) return process.env.FRONTEND_BASE_URL;
    console.warn('WARNING: FRONTEND_BASE_URL is not defined. Falling back to request headers.');
    const scheme = getScheme(req);
    const host = getHost(req) || '';
    if (/localhost:5000|127\.0\.0\.1:5000/.test(host)) {
        return 'http://localhost:3000';
    }
    const hostname = host.split(':')[0];
    return `${scheme}://${hostname}`;
};

router.get('/auth/url', (req, res) => {
    const state = Math.random().toString(36).substring(2, 15);
    let username = req.session?.user;
    if (!username) {
        try {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                username = decoded?.username;
                if (username) req.session.user = username;
            }
        } catch (e) {}
    }
    if (!username) return res.status(401).json({ error: '请先登录系统' });
    const stateData = { state, username };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');
    const scheme = getScheme(req);
    const host = getHost(req);
    const apiBase = `${scheme}://${host}`;
    const scope = encodeURIComponent('repo read:org');
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(apiBase + '/api/auth/callback')}&state=${encodedState}&scope=${scope}`;
    res.json({ authUrl });
});

router.get('/auth/status', async (req, res) => {
    let username = req.session?.user;
    if (!username) {
        try {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                username = decoded?.username;
            }
        } catch (e) {}
    }
    if (!username) return res.status(401).json({ error: '请先登录系统' });
    try {
        const { getUserGitHubToken } = await import('../services/accountService.js');
        const token = await getUserGitHubToken(username);
        res.json({ connected: !!token, message: token ? 'GitHub已连接' : 'GitHub未连接' });
    } catch (error) {
        res.json({ connected: false, message: '检查连接状态失败' });
    }
});

router.get('/auth/callback', async (req, res) => {
    const code = req.query.code;
    if(!code) return res.json({ error: '缺少code' });
    try {
        const fetchWithRetry = async (url, options, maxRetries = 3) => {
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 45000);
                    const response = await fetch(url, { ...options, signal: controller.signal });
                    clearTimeout(timeoutId);
                    return response;
                } catch (error) {
                    if (i === maxRetries - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        };
        const params = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: `${getScheme(req)}://${getHost(req)}/api/auth/callback`
        });
        const tokenResponse = await fetchWithRetry('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'BlockchainCollabEval/1.0'
            },
            body: params.toString()
        });
        if (!tokenResponse.ok) throw new Error(`GitHub API响应错误: ${tokenResponse.status} ${tokenResponse.statusText}`);
        const data = await tokenResponse.json();
        if (data.access_token) {
            let currentUser = null;
            try {
                const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
                currentUser = stateData.username;
            } catch (error) {
                currentUser = req.session?.user;
            }
            if (!currentUser) {
                const feBase = getFrontendBaseUrl(req);
                return res.redirect(`${feBase}/login?error=请先登录系统`);
            }
            try {
                const encryptedToken = await encryptToken(data.access_token);
                await updateUserGitHubToken(currentUser, encryptedToken);
                try {
                    const { Octokit } = await import('octokit');
                    const ok = new Octokit({ auth: data.access_token });
                    const { data: ghUser } = await ok.rest.users.getAuthenticated();
                    await updateUserGitHubIdentity(currentUser, {
                        login: ghUser?.login || null,
                        id: ghUser?.id || null,
                        avatar: ghUser?.avatar_url || null
                    });
                } catch (e) {}
                const feBase = getFrontendBaseUrl(req);
                res.redirect(`${feBase}/dashboard?success=true&message=GitHub连接成功`);
            } catch (error) {
                const feBase = getFrontendBaseUrl(req);
                res.redirect(`${feBase}/dashboard?error=Token存储失败`);
            }
        } else {
            const feBase = getFrontendBaseUrl(req);
            res.redirect(`${feBase}/dashboard?error=GitHub授权失败`);
        }
    } catch (error) {
        const feBase = getFrontendBaseUrl(req);
        res.redirect(`${feBase}/dashboard?error=GitHub连接失败，请稍后重试`);
    }
});

export default router;
