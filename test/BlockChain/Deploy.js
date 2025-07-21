import { Web3 } from 'web3';
import fs from 'fs';

// 1. 连接节点
const web3 = new Web3('http://192.168.3.40:8545');

// 2. 添加私钥到 web3 钱包
const privateKey = '0x你的私钥'; // 千万不要泄露
const account = web3.eth.accounts.wallet.add(privateKey);

// 3. 读取 ABI
const abi = JSON.parse(fs.readFileSync('./test/BlockChain/SimpleStorage_sol_SimpleStorage.abi', 'utf-8'));
const contractAddress = '0x你的合约地址';
const contract = new web3.eth.Contract(abi, contractAddress);

// 4. 发送交易（如 setNum）
async function main() {
    // 读取
    const oldValue = await contract.methods.getNum().call();
    console.log('初始 getNum():', oldValue);

    // 写入
    const tx = await contract.methods.setNum(888).send({
        from: account.address, // 用私钥对应的地址
        gas: 100000,
        gasPrice: '20000000000',
        type: '0x0'
    });
    console.log('setNum(888) 交易哈希:', tx.transactionHash);

    // 再次读取
    const newValue = await contract.methods.getNum().call();
    console.log('更新后 getNum():', newValue);
}

main().catch(console.error);
