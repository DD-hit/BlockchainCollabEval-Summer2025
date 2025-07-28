import Web3 from 'web3';
import { pool } from '../../config/database.js';

// Web3 实例配置
const WEB3_PROVIDER = 'http://192.168.139.129:8545';

export const getAddress = async (username) => {
    try {
        const queryResult = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (queryResult[0].length === 0) {
            throw new Error('用户不存在');
        }
        return queryResult[0][0].address;
    } catch (error) {
        console.error('获取地址失败:', error);
        throw error;
    }
}

export const getBalance = async (address) => {
    try {
        const web3 = new Web3(WEB3_PROVIDER);
        const balance = await web3.eth.getBalance(address);
        console.log(`地址 ${address} 的余额:`, balance);
        return balance;
    } catch (error) {
        console.error('获取余额失败:', error);
        throw error;
    }
}

