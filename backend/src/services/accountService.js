import Web3 from 'web3';
import { pool } from '../../config/database.js';
import jwt from 'jsonwebtoken';
import { getBalance } from '../utils/eth.js';
import { EncryptionService } from '../utils/encryption.js';
import { WEB3_PROVIDER } from '../config/config.js';

// 密码强度验证函数
function validatePasswordStrength(password) {
    const feedback = [];
    let score = 0;

    // 长度检查
    if (password.length < 8) {
        feedback.push('密码长度至少需要8位');
    } else if (password.length >= 12) {
        score += 2;
    } else {
        score += 1;
    }

    // 包含数字
    if (/\d/.test(password)) {
        score += 1;
    }

    // 包含小写字母
    if (/[a-z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('密码必须包含小写字母');
    }

    // 包含大写字母
    if (/[A-Z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('密码必须包含大写字母');
    }

    // 包含特殊字符
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score += 1;
    } else {
        feedback.push('密码必须包含特殊字符');
    }

    // 不能包含常见弱密码
    const weakPasswords = ['123456', 'password', 'qwerty', 'admin', '123456789', '12345678'];
    if (weakPasswords.includes(password.toLowerCase())) {
        feedback.push('不能使用常见弱密码');
        score = 0;
    }

    // 必须包含大小写字母和特殊字符才能通过
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const isValid = hasLowercase && hasUppercase && hasSpecialChar && password.length >= 8;
    const message = isValid ? '密码强度符合要求' : feedback.join(', ');

    return { isValid, score, message, feedback };
}

export class AccountService {

    //登录账号
    static async loginAccount(username, password) {
        const [queryResult] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (queryResult.length === 0) {  // 检查第一个元素（rows）的长度
            throw new Error('用户不存在');
        }
        
        // 验证密码
        const isPasswordValid = await EncryptionService.verifyPassword(password, queryResult[0].password);
        if (!isPasswordValid) {
            throw new Error('密码错误');
        }
        
        const token = jwt.sign({ username: username, address: queryResult[0].address }, "123456789", { expiresIn: '24h' });
        await pool.execute('update user set status = 1 where username = ?', [username]);
        
        // 给该用户发送10eth
        try {
            const web3 = new Web3(WEB3_PROVIDER);
            const senderAddress = '0x8d8827677E88986F56D5cef372A259Fd7574ac45';
            const senderPrivateKey = '0x42b622069b0edddd24dbd6fb6d9ae670e250bc4946d5d52e4c465b1dba73dc51'; 
            
            // 检查发送者余额
            const senderBalance = await web3.eth.getBalance(senderAddress);
            const transferAmount = web3.utils.toWei('10', 'ether');
            
            if (BigInt(senderBalance) >= BigInt(transferAmount)) {
                // 获取nonce
                const nonce = await web3.eth.getTransactionCount(senderAddress, 'latest');
                
                // 构造交易
                const tx = {
                    from: senderAddress,
                    to: queryResult[0].address,
                    value: transferAmount,
                    gas: 21000,
                    gasPrice: await web3.eth.getGasPrice(),
                    nonce: nonce
                };

                // 签名并发送交易
                const signedTx = await web3.eth.accounts.signTransaction(tx, senderPrivateKey);
                const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
                
                console.log(`转账成功: ${queryResult[0].address} 收到 10 ETH, 交易哈希: ${receipt.transactionHash}`);
            } else {
                console.log('发送者余额不足，无法转账');
            }
        } catch (error) {
            console.error('转账失败:', error.message);
            // 转账失败不影响登录
        }
        
        return {
            token: token,
            username: username,
            address: queryResult[0].address
        }
    }

    // 创建账户的业务逻辑
    static async createAccount(username, password) {


        // 1. 验证输入
        const [_username] = await pool.execute('SELECT username FROM user WHERE username = ?', [username]);
        if (_username.length > 0) {
            throw new Error('用户已存在');
        }
        if (!password) {
            throw new Error('密码不能为空');
        }

        if (password.length < 8) {
            throw new Error('密码长度至少需要8位');
        }

        // 增强的密码强度验证
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            throw new Error(`密码强度不够: ${passwordValidation.message}`);
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



        // 3. 加密密码和私钥
        const hashedPassword = await EncryptionService.hashPassword(password);
        const encryptedPrivateKey = EncryptionService.encryptPrivateKey(account.privateKey, password);

        // 4. 保存到数据库
        const [result] = await pool.execute(
            'INSERT INTO user (username, password, address, createdAt,privateKey) VALUES (?, ?, ?, now(),?)',
            [username, hashedPassword, account.address, encryptedPrivateKey]
        );



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
        if (password) {
            if (password.length < 8) {
                throw new Error('密码长度至少需要8位');
            }
            
            // 增强的密码强度验证
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                throw new Error(`密码强度不够: ${passwordValidation.message}`);
            }
            
            const hashedPassword = await EncryptionService.hashPassword(password);
            await pool.execute('UPDATE user SET password = ? WHERE username = ?', [hashedPassword, username]);
        }

        return {
            username: username,
            message: '用户信息更新成功'
        };
    }

    // 获取用户私钥（需要密码验证）
    static async getPrivateKey(username, password) {
        const [user] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (user.length === 0) {
            throw new Error('用户不存在');
        }

        // 验证密码
        const isPasswordValid = await EncryptionService.verifyPassword(password, user[0].password);
        if (!isPasswordValid) {
            throw new Error('密码错误');
        }

        // 解密私钥
        const privateKey = EncryptionService.decryptPrivateKey(user[0].privateKey, password);
        
        return {
            privateKey: privateKey,
            address: user[0].address
        };
    }

    // 更新用户状态
    static async updateUserStatus(username, status) {
        const [user] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (user.length === 0) {
            throw new Error('用户不存在');
        }
        
        const [updateResult] = await pool.execute('UPDATE user SET status = ? WHERE username = ?', [status, username]);
        
        return {
            success: true,
            message: status === 1 ? '用户状态已更新为在线' : '用户状态已更新为离线'
        };
    }

    // 退出登录 
    static async logout(username) {
        return await this.updateUserStatus(username, 0);
    }


    static async getContributor(contributorAddress) {
        const [result] = await pool.execute(
            `SELECT * FROM user WHERE address = ?`,
            [contributorAddress]
        );
        if (result.length === 0) {
            return null; // 或者抛出错误，取决于业务需求
        }
        return result[0].username;

    }

}
