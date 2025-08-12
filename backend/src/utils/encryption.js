import bcrypt from 'bcrypt';
import CryptoJS from 'crypto-js';

const SALT_ROUNDS = 12; // bcrypt 盐轮数

export class EncryptionService {
    
    /**
     * 哈希密码
     * @param {string} password - 明文密码
     * @returns {Promise<string>} - 哈希后的密码
     */
    static async hashPassword(password) {
        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            return hashedPassword;
        } catch (error) {
            console.error('密码哈希失败:', error);
            throw new Error('密码加密失败');
        }
    }

    /**
     * 验证密码
     * @param {string} password - 明文密码
     * @param {string} hashedPassword - 哈希后的密码
     * @returns {Promise<boolean>} - 验证结果
     */
    static async verifyPassword(password, hashedPassword) {
        try {
            const isValid = await bcrypt.compare(password, hashedPassword);
            return isValid;
        } catch (error) {
            console.error('密码验证失败:', error);
            return false;
        }
    }

    /**
     * 加密私钥
     * @param {string} privateKey - 明文私钥
     * @param {string} password - 用户密码（用作加密密钥）
     * @returns {string} - 加密后的私钥
     */
    static encryptPrivateKey(privateKey, password) {
        try {
            // 使用用户密码作为密钥来加密私钥
            const encrypted = CryptoJS.AES.encrypt(privateKey, password).toString();
            return encrypted;
        } catch (error) {
            console.error('私钥加密失败:', error);
            throw new Error('私钥加密失败');
        }
    }

    /**
     * 解密私钥
     * @param {string} encryptedPrivateKey - 加密后的私钥
     * @param {string} password - 用户密码（用作解密密钥）
     * @returns {string} - 解密后的私钥
     */
    static decryptPrivateKey(encryptedPrivateKey, password) {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
            const privateKey = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!privateKey) {
                throw new Error('私钥解密失败 - 密码可能不正确');
            }
            
            return privateKey;
        } catch (error) {
            console.error('私钥解密失败:', error);
            throw new Error('私钥解密失败');
        }
    }


}
