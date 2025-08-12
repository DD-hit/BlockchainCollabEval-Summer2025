import { EncryptionService } from '../src/utils/encryption.js';

// 简单测试加密功能
async function testBasicEncryption() {
    console.log('=== 基本加密功能测试 ===\n');
    
    const testPassword = 'test123';
    const testPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    
    try {
        // 1. 测试密码哈希
        console.log('1. 测试密码哈希...');
        const hashedPassword = await EncryptionService.hashPassword(testPassword);
        console.log('原始密码:', testPassword);
        console.log('哈希密码:', hashedPassword);
        
        // 2. 测试密码验证
        console.log('\n2. 测试密码验证...');
        const isValid = await EncryptionService.verifyPassword(testPassword, hashedPassword);
        console.log('密码验证结果:', isValid);
        
        // 3. 测试私钥加密解密
        console.log('\n3. 测试私钥加密解密...');
        const encryptedPrivateKey = EncryptionService.encryptPrivateKey(testPrivateKey, testPassword);
        const decryptedPrivateKey = EncryptionService.decryptPrivateKey(encryptedPrivateKey, testPassword);
        console.log('私钥匹配:', testPrivateKey === decryptedPrivateKey);
        
        console.log('\n✅ 所有基本功能测试通过！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 运行测试
testBasicEncryption();
