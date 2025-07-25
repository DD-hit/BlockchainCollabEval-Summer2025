import express from 'express';
import Web3 from 'web3';
import cors from 'cors';

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 提供log.html文件
app.get('/log', (req, res) => {
    res.sendFile('log.html', { root: './src' });
});

// 创建Web3实例（这里使用本地测试网络，你可以根据需要修改）
const web3 = new Web3('http://192.168.139.129:8545'); // 或者使用其他网络

// API端点：创建新账户
app.post('/api/create-account', async (req, res) => {
    try {
        const { password } = req.body;
        
        // 验证密码
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: '密码长度至少需要6位'
            });
        }
        
        // 使用web3.js创建新账户
        const account = web3.eth.accounts.create();
        
        const encryptedPrivateKey = web3.eth.accounts.encrypt(account.privateKey, password);
        
        const accountInfo = {
            address: account.address,
            privateKey: account.privateKey, // 注意：实际应用中不应该直接返回私钥
            encryptedPrivateKey: encryptedPrivateKey,
            publicKey: account.publicKey,
            createdAt: new Date().toISOString()
        };
        
        console.log('新账户已创建:', accountInfo.address);
        
        res.json({
            success: true,
            message: '账户创建成功，请妥善保管私钥',
            data: accountInfo
        });
        
    } catch (error) {
        console.error('创建账户时出错:', error);
        res.status(500).json({
            success: false,
            message: '创建账户失败',
            error: error.message
        });
    }
});

// 验证账户端点
app.get('/api/verify-account/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        // 验证地址格式
        if (!web3.utils.isAddress(address)) {
            return res.status(400).json({
                success: false,
                message: '无效的地址格式'
            });
        }
        
        // 获取账户信息
        const balance = await web3.eth.getBalance(address);
        const nonce = await web3.eth.getTransactionCount(address);
        const code = await web3.eth.getCode(address);
        
        // 判断账户类型
        const isContract = code.length > 2;
        const accountType = isContract ? '智能合约账户' : '普通账户 (EOA)';
        
        // 判断账户是否存在
        const exists = balance > 0 || nonce > 0 || isContract;
        
        const accountInfo = {
            address: address,
            balance: balance,
            balanceInEth: web3.utils.fromWei(balance, 'ether'),
            nonce: nonce,
            isContract: isContract,
            accountType: accountType,
            exists: exists
        };
        
        res.json({
            success: true,
            message: exists ? '账户存在' : '账户不存在或为空',
            data: accountInfo
        });
        
    } catch (error) {
        console.error('验证账户时出错:', error);
        res.status(500).json({
            success: false,
            message: '验证账户失败',
            error: error.message
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}/log`);
    console.log('可用的API端点:');
    console.log('- GET /log - 账户创建页面');
    console.log('- POST /api/create-account - 创建账户');
    console.log('- GET /api/verify-account/:address - 验证账户');
});
