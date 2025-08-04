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

/**
 * 部署合约
 * @param {string} abi - 合约ABI
 * @param {string} bytecode - 合约字节码
 * @param {Array} constructorArgs - 构造函数参数数组
 * @param {string} fromAddress - 部署者地址
 * @param {string} privateKey - 部署者私钥
 * @param {number} [gas=3000000] - Gas上限
 * @returns {Promise<string>} - 返回合约地址
 */
export const deployContract = async (abi, bytecode, constructorArgs, fromAddress, privateKey, gas = 3000000) => {
    const web3 = new Web3(WEB3_PROVIDER);
    const contract = new web3.eth.Contract(abi);

    // 构造部署数据
    const deployTx = contract.deploy({
        data: bytecode,
        arguments: constructorArgs
    });

    const deploymentData = deployTx.encodeABI();

    // 获取nonce - 检查不同状态的nonce
    const pendingNonce = await web3.eth.getTransactionCount(fromAddress, 'pending');
    const latestNonce = await web3.eth.getTransactionCount(fromAddress, 'latest');
    
    console.log(`地址 ${fromAddress} 的 nonce 状态:`);
    console.log(`  - pending nonce: ${pendingNonce}`);
    console.log(`  - latest nonce: ${latestNonce}`);
    console.log(`  - 差异: ${pendingNonce - latestNonce} (pending - latest)`);
    
    // 使用 latest nonce 来避免 pending 交易的影响
    const nonce = latestNonce;
    console.log(`使用 nonce: ${nonce}`);
    // 获取当前gas价格
    const gasPrice = await web3.eth.getGasPrice();

    // 构造交易对象
    const tx = {
        from: fromAddress,
        data: deploymentData,
        gas,
        gasPrice,
        nonce
    };

    // 签名交易
    const signed = await web3.eth.accounts.signTransaction(tx, privateKey);

    // 发送交易
    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);

    // 返回合约地址
    return receipt.contractAddress;
}



