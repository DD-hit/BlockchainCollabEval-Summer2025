// 1. 导入必要的包
import { Web3 } from 'web3';          // Web3 库，用于和以太坊交互
import fs from 'fs';                  // Node.js 文件系统模块，用于读取文件

// 2. 连接到以太坊节点
const web3 = new Web3('http://192.168.139.129:8545');  // 创建 Web3 实例，连接到指定节点

// 3. 读取合约 ABI（Application Binary Interface，合约接口描述）
const abi = JSON.parse(fs.readFileSync(
    './test/BlockChain/SimpleStorage_sol_SimpleStorage.abi', 
    'utf-8'
));  // 读取并解析 ABI 文件

// 4. 创建合约实例
const contractAddress = '0xf5164726194946f5976Ab0E13BdF9c3657c19992';  // 已部署合约的地址
const contract = new web3.eth.Contract(abi, contractAddress);  // 用 ABI 和地址创建合约实例

// 5. 主函数
async function main() {
    // 6. 获取账户列表
    // const accounts = await web3.eth.getAccounts();  // 获取节点的账户列表
    // console.log('使用账户:', accounts[0]);          // 使用第一个账户
    const account = web3.eth.accounts.wallet.add('0xcdcfb484cf3017bfa27f2ce8d22a58d4ed6d2a3fe327b9f28e2eef39a3cd6ed7');

    // 7. 调用只读方法（view 函数）
    const oldValue = await contract.methods.getNum().call();  // 调用 getNum()，不需要发送交易
    console.log('初始 getNum():', oldValue);

    try {
        // 8. 调用写入方法（需要发送交易）
        const tx = await contract.methods.setNum(123).send({ 
            from: web3.eth.accounts.wallet[0].address,           // 交易发送者
            gas: 100000,                 // gas 限制
            gasPrice: '20000000000',     // gas 价格（20 Gwei）
            type: '0x0'                  // 使用传统交易类型（非 EIP-1559）
        });
        // 9. 打印交易结果
        console.log('setNum(123) 交易成功，交易哈希:', tx.transactionHash);

        // 10. 确认更新结果
        const newValue = await contract.methods.getNum().call();
        console.log('更新后 getNum():', newValue);
    } catch (error) {
        console.error('交易失败:', error.message);
    }
}

// 11. 运行主函数并处理错误

main().catch(console.error);
