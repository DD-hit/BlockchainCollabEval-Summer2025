import Web3 from 'web3';

const web3 = new Web3('http://192.168.139.129:8545');

async function verifyAccount(address) {
    try {
        console.log('=== 验证账户是否存在 ===\n');
        console.log('账户地址:', address);
        
        // 1. 检查地址格式是否有效
        if (!web3.utils.isAddress(address)) {
            console.log('❌ 地址格式无效');
            return false;
        }
        console.log('✅ 地址格式有效');
        
        // 2. 检查账户余额
        const balance = await web3.eth.getBalance(address);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        console.log('💰 账户余额:', balance, 'wei');
        console.log('💰 账户余额:', balanceInEth, 'ETH');
        
        // 3. 检查交易数量（nonce）
        const nonce = await web3.eth.getTransactionCount(address);
        console.log('📊 交易数量 (nonce):', nonce);
        
        // 4. 检查账户代码（如果是合约账户）
        const code = await web3.eth.getCode(address);
        console.log('📄 账户代码长度:', code.length);
        
        // 5. 判断账户类型
        if (code.length > 2) {
            console.log('🏗️ 账户类型: 智能合约账户');
        } else {
            console.log('👤 账户类型: 普通账户 (EOA)');
        }
        
        // 6. 检查账户是否存在
        const exists = balance > 0 || nonce > 0 || code.length > 2;
        console.log('\n📋 验证结果:', exists ? '✅ 账户存在' : '❌ 账户不存在或为空');
        
        return exists;
        
    } catch (error) {
        console.error('❌ 验证过程中出错:', error.message);
        return false;
    }
}

// 测试函数
async function testVerification() {
    // 测试一个已知存在的账户（如果有的话）
    const testAddress = '0x89Ac54357Dbf0B6fb08e30918d420eF25E58Fce1'; // 替换为你的账户地址
    
    console.log('测试验证功能...\n');
    await verifyAccount(testAddress);
    
    // 测试一个不存在的地址
    console.log('\n' + '='.repeat(50) + '\n');
    const fakeAddress = '0x1234567890123456789012345678901234567890';
    await verifyAccount(fakeAddress);
}

// 运行测试
testVerification(); 