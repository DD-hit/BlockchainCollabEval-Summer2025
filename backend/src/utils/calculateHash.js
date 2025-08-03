import crypto from 'crypto';
import fs from 'fs';

/**
 * 计算文件的SHA256哈希值
 * @param {Object} file - multer上传的文件对象
 * @returns {Promise<string>} 文件的SHA256哈希值
 */
export const calculateFileHash = async (file) => {
    return new Promise((resolve, reject) => {
        try {
            // 创建SHA256哈希对象
            const hash = crypto.createHash('sha256');
            
            // 创建文件读取流
            const stream = fs.createReadStream(file.path);
            
            // 监听数据事件，将数据添加到哈希计算中
            stream.on('data', (data) => {
                hash.update(data);
            });
            
            // 监听结束事件，获取最终的哈希值
            stream.on('end', () => {
                const fileHash = hash.digest('hex');
                resolve(fileHash);
            });
            
            // 监听错误事件
            stream.on('error', (error) => {
                reject(new Error(`计算文件哈希失败: ${error.message}`));
            });
        } catch (error) {
            reject(new Error(`计算文件哈希失败: ${error.message}`));
        }
    });
};

/**
 * 计算字符串的SHA256哈希值
 * @param {string} content - 要计算哈希的字符串内容
 * @returns {string} 字符串的SHA256哈希值
 */
export const calculateStringHash = (content) => {
    return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * 计算文件内容的MD5哈希值（用于快速校验）
 * @param {Object} file - multer上传的文件对象
 * @returns {Promise<string>} 文件的MD5哈希值
 */
export const calculateFileMD5 = async (file) => {
    return new Promise((resolve, reject) => {
        try {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(file.path);
            
            stream.on('data', (data) => {
                hash.update(data);
            });
            
            stream.on('end', () => {
                const fileHash = hash.digest('hex');
                resolve(fileHash);
            });
            
            stream.on('error', (error) => {
                reject(new Error(`计算文件MD5失败: ${error.message}`));
            });
        } catch (error) {
            reject(new Error(`计算文件MD5失败: ${error.message}`));
        }
    });
};
