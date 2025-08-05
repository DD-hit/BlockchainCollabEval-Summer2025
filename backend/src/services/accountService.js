import Web3 from 'web3';
import { pool } from '../../config/database.js';
import jwt from 'jsonwebtoken';
import { getBalance } from '../utils/eth.js';

export class AccountService {

    //登录账号
    static async loginAccount(username, password) {
        const [queryResult] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (queryResult.length === 0) {  // 检查第一个元素（rows）的长度
            throw new Error('用户不存在');
        }
        if (queryResult[0].password === password) {
            const token = jwt.sign({ username: username, address: queryResult[0].address }, "123456789", { expiresIn: '24h' });
            await pool.execute('update user set status = 1 where username = ?', [username]);
            return {
                token: token,
                username: username,
                address: queryResult[0].address
            }
        } else {
            throw new Error('密码错误');
        }
    }

    // 创建账户的业务逻辑
    static async createAccount(username, password) {
        console.log('开始创建账户，密码长度:', password.length);

        // 1. 验证输入
        const [_username] = await pool.execute('SELECT username FROM user WHERE username = ?', [username]);
        if (_username.length > 0) {
            throw new Error('用户已存在');
        }
        if (!password) {
            throw new Error('密码不能为空');
        }

        if (password.length < 6) {
            throw new Error('密码长度至少需要6位');
        }

        // 2. 创建区块链账户
        const web3 = new Web3('http://192.168.139.129:8545');
        const account = web3.eth.accounts.create();

        const accountInfo = {
            username: username,
            address: account.address,
            privateKey: account.privateKey,
            createdAt: new Date().toISOString()
        };

        console.log('区块链账户创建成功:', account.address);

        // 3. 保存到数据库
        const [result] = await pool.execute(
            'INSERT INTO user (username, password, address, createdAt) VALUES (?, ?, ?, now())',
            [username, password, account.address]
        );

        console.log('账户已保存到数据库');

        // 4. 返回结果
        return accountInfo;
    }

    //获取用户列表
    static async getUserList() {
        const [queryResult] = await pool.execute('SELECT username,address FROM user');
        return queryResult;
    }

    // 获取余额
    static async getBalance(address) {
        const balance = await getBalance(address);
        return {
            balance: balance.toString()  // 将BigInt转换为字符串
        };
    }

    // 更新用户信息
    static async updateProfile(username, password) {
        // 验证用户是否存在
        const [user] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (user.length === 0) {
            throw new Error('用户不存在');
        }

        // 更新密码
        if (password && password.length >= 6) {
            await pool.execute('UPDATE user SET password = ? WHERE username = ?', [password, username]);
        }

        return {
            username: username,
            message: '用户信息更新成功'
        };
    }

    // 退出登录 
    static async logout(username) {
        console.log(`🔍 开始处理用户 ${username} 的登出请求`);
        
        const [user] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (user.length === 0) {
            console.log(`❌ 用户 ${username} 不存在`);
            throw new Error('用户不存在');
        }
        
        console.log(`✅ 用户 ${username} 存在，当前状态: ${user[0].status}`);
        
        const [updateResult] = await pool.execute('UPDATE user SET status = 0 WHERE username = ?', [username]);
        console.log(`📝 更新结果:`, updateResult);
        
        console.log(`✅ 用户 ${username} 状态已更新为离线`);
        
        return {
            success: true,
            message: '退出登录成功'
        };
    }

}
