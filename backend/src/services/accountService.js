import Web3 from 'web3';
// import { Account } from '../models/Account.js';

export class AccountService {
    // 创建账户的业务逻辑
    static async createAccount(password) {
        console.log('开始创建账户，密码长度:', password.length);
        
        // 1. 验证输入
        if (!password) {
            throw new Error('密码不能为空');
        }
        
        if (password.length < 6) {
            throw new Error('密码长度至少需要6位');
        }
        
        // 2. 创建区块链账户
        const web3 = new Web3();
        const account = web3.eth.accounts.create();

        const accountInfo = {
            address: account.address,
            privateKey: account.privateKey, 
            createdAt: new Date().toISOString()
        };

        console.log('区块链账户创建成功:', account.address);
        
        return accountInfo;
        
        // // 3. 保存到数据库
        // const savedAccount = await Account.create({
            
        // });
        
        // console.log('账户已保存到数据库，ID:', savedAccount.id);
        
        // // 4. 返回结果
        // return {
        //     id: savedAccount.id,
        //     address: savedAccount.address,
        //     privateKey: savedAccount.privateKey,
        //     balance: savedAccount.balance,
        //     createdAt: savedAccount.createdAt
        // };
    }
    
    // 获取账户的业务逻辑
    static async getBalance(address) {
        const web3 = new Web3();
        const balance = await web3.eth.getBalance(address);
        return balance;
    }
}
