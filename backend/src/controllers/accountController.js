// controllers/accountController.js - 项目的"接待员"
import { AccountService } from '../services/accountService.js';
import { pool } from '../../config/database.js';

// 新增：获取当前用户的 GitHub 绑定信息
export const getGithubBinding = async (req, res) => {
    try {
        const username = req.user?.username;
        if (!username) {
            return res.status(401).json({ success: false, message: '未登录' });
        }
        const [rows] = await pool.execute('SELECT github_login, github_id, github_avatar, github_token FROM user WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }
        const row = rows[0];
        const bound = !!row.github_token && !!row.github_login;
        res.json({
            success: true,
            data: {
                bound,
                github_login: row.github_login || null,
                github_id: row.github_id || null,
                github_avatar: row.github_avatar || null
            }
        });
    } catch (error) {
        console.error('获取GitHub绑定信息失败:', error);
        res.status(500).json({ success: false, message: '获取GitHub绑定信息失败' });
    }
};

// 新增：解绑 GitHub（清空 token 与身份）
export const unbindGithub = async (req, res) => {
    try {
        const username = req.user?.username;
        if (!username) {
            return res.status(401).json({ success: false, message: '未登录' });
        }
        const { removeUserGitHubToken } = await import('../services/accountService.js');
        await removeUserGitHubToken(username);
        res.json({ success: true, message: '已解绑 GitHub' });
    } catch (error) {
        console.error('解绑GitHub失败:', error);
        res.status(500).json({ success: false, message: '解绑失败' });
    }
};

// 处理登录的请求
export const loginAccount = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                message: '密码不能为空'
            });
        }
        
        const result = await AccountService.loginAccount(username.trim(), password);
        
        // 设置session
        req.session.user = username.trim();
        
        // 生成GitHub授权URL（兼容本地与服务器环境）
        const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23lijDYlWd2i55uOKv';
        const state = Math.random().toString(36).substring(2, 15);
        // 将用户名编码到state中
        const stateData = { state, username: username.trim() };
        const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');
        const scheme = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers['host'];
        const base = `${scheme}://${host}`;
        const scope = encodeURIComponent('repo read:org');
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(base + '/api/auth/callback')}&state=${encodedState}&scope=${scope}`;
        
        res.json({
            success: true,
            message: '登录成功',
            data: {
                ...result,
                githubAuthUrl: githubAuthUrl
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// 处理创建账户的请求
export const createAccount = async (req, res) => {
    try {
        // 1. 获取请求数据
        const { username, password } = req.body;
        
        // 2. 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                message: '密码不能为空'
            });
        }
        
        // 用户名长度验证
        if (username.trim().length < 2 || username.trim().length > 20) {
            return res.status(400).json({
                success: false,
                message: '用户名长度必须在2-20个字符之间'
            });
        }
        
        // 3. 调用业务逻辑层处理
        const result = await AccountService.createAccount(username.trim(), password);
        
        // 4. 返回成功响应
        res.json({
            success: true,
            message: '账户创建成功',
            data: result
        });
        
    } catch (error) {
        console.error('创建账户失败:', error);
        
        // 5. 返回错误响应
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getBalance = async (req, res) => {
    try {
        const address = req.user.address;
        const balance = await AccountService.getBalance(address);
        res.json({
            success: true,
            message: '余额获取成功',
            data: balance
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 处理更新用户信息的请求
export const updateProfile = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        // 用户名长度验证
        if (username.trim().length < 2 || username.trim().length > 20) {
            return res.status(400).json({
                success: false,
                message: '用户名长度必须在2-20个字符之间'
            });
        }
        
        const result = await AccountService.updateProfile(username.trim(), password);
        res.json({
            success: true,
            message: '用户信息更新成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        // 支持从请求体、查询参数或token获取username
        let username;
        if (req.body && req.body.username) {
            username = req.body.username;
        } else if (req.query && req.query.username) {
            username = req.query.username;
        } else if (req.user && req.user.username) {
            username = req.user.username;
        } else {
            throw new Error('用户名不能为空');
        }
        
        if (!username) {
            throw new Error('用户名不能为空');
        }
        
        const result = await AccountService.logout(username);
        
        // // 清理GitHub token
        // try {
        //     const { clearUserGitHubTokenOnly } = await import('../services/accountService.js');
        //     await clearUserGitHubTokenOnly(username);
        //     console.log(`用户 ${username} 登出，已清理GitHub token`);
        // } catch (error) {
        //     console.error(`清理用户 ${username} 的GitHub token失败:`, error);
        // }
        
        res.json({
            success: true,
            message: '退出登录成功',
            data: result
        });
    } catch (error) {
        console.error('logout控制器错误:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// 处理获取私钥的请求
export const getPrivateKey = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        if (!password || !password.trim()) {
            return res.status(400).json({
                success: false,
                message: '密码不能为空'
            });
        }
        
        const result = await AccountService.getPrivateKey(username.trim(), password);
        res.json({
            success: true,
            message: '私钥获取成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
