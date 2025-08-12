import { pool } from '../../config/database.js';
import { calculateFileHash } from '../utils/calculateHash.js';
import { deployContract, getAddress } from '../utils/eth.js';
import { ContributionScoreABI, ContributionScoreBytecode } from '../utils/contracts.js';
import { SubtaskService } from './subtaskService.js';
import fs from 'fs/promises';

export class FilesService {

static async downloadFile(filename) {
    try {
        const [rows] = await pool.execute('SELECT filePath FROM files WHERE filename = ?', [filename]);
        if (rows.length === 0) {
            throw new Error('文件不存在');
        }
        const filePath = rows[0].filePath;
        // 异步读取
        const file = await fs.readFile(filePath); 
        return file;
    } catch (error) {
        throw new Error(`下载文件失败: ${error.message}`);
    }
}

    static async uploadFiles(file, description, username, subtaskId, verifiedPrivateKey) {
        try {
            // 注意：verifiedPrivateKey 是已经通过密码验证并解密得到的私钥
            // 这样可以确保只有知道正确密码的用户才能使用自己的私钥

            // 计算文件hash
            const fileHash = await calculateFileHash(file);
            console.log(`文件 ${file.originalname} 的哈希值: ${fileHash}`);

            //部署合约
            const fromAddress = await getAddress(username);
            const subtask = await SubtaskService.getSubtaskDetail(subtaskId);
            
            if (!subtask) {
                throw new Error('子任务不存在');
            }

            // 确保时间参数是数字类型
            const startTime = parseInt(subtask.startTime) || Math.floor(Date.now() / 1000);
            const endTime = parseInt(subtask.endTime) || (startTime + 86400); // 默认24小时后
            const weight = parseInt(subtask.priority) || 1;

            const receipt = await deployContract(
                ContributionScoreABI,
                ContributionScoreBytecode,
                [
                    fromAddress,           // _contributor: 贡献者地址
                    fileHash,              // _contributionHash: 贡献哈希
                    weight,                // _weight: 权重
                    startTime,             // _subtaskStartTime: 开始时间
                    endTime                // _subtaskEndtime: 结束时间
                ],
                fromAddress,
                verifiedPrivateKey
            );

            const [result] = await pool.execute(
                `INSERT INTO files (
                    originalName, fileName, filePath, fileType, fileSize, 
                    fileHash, username, uploadTime, subtaskId,
                    address, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
                [
                    file.originalname,    // 原始文件名
                    file.filename,        // 服务器文件名
                    file.path,            // 文件路径
                    file.mimetype,        // 文件类型
                    file.size,            // 文件大小
                    fileHash,             // 文件哈希值
                    username,             // 上传用户
                    subtaskId,            // 所属任务
                    receipt.contractAddress,      // 合约地址
                    description           // 描述
                ]
            );
            
            const uploadedFile = {
                fileId: result.insertId,
                originalName: file.originalname,
                fileName: file.filename,
                filePath: file.path,
                fileType: file.mimetype,
                fileSize: file.size,
                fileHash: fileHash,
                username: username,
                uploadTime: Date.now(),
                subtaskId: subtaskId,
                contractAddress: receipt.contractAddress,
                description: description
            };
            
            return uploadedFile;
        } catch (error) {
            throw new Error(`文件上传失败: ${error.message}`);
        }
    }

    static async getFiles() {
        try {
            const [rows] = await pool.execute('SELECT * FROM files ORDER BY uploadTime DESC');
            return rows;
        } catch (error) {
            throw new Error(`获取文件列表失败: ${error.message}`);
        }
    }

    static async getFileDetail(fileId) {
        try {
            const [rows] = await pool.execute('SELECT * FROM files WHERE id = ?', [fileId]);
            return rows[0];
        } catch (error) {
            throw new Error(`获取文件详情失败: ${error.message}`);
        }
    }

    static async deleteFile(fileId) {
        try {
            // 先获取文件信息
            const [files] = await pool.execute('SELECT * FROM files WHERE id = ?', [fileId]);
            
            if (files.length === 0) {
                throw new Error('文件不存在');
            }

            // 删除数据库记录
            const [result] = await pool.execute('DELETE FROM files WHERE id = ?', [fileId]);
            
            if (result.affectedRows === 0) {
                throw new Error('删除失败');
            }

            // 这里可以添加删除物理文件的逻辑
            // const filePath = files[0].filePath;
            // fs.unlinkSync(filePath);
            
            return { success: true };
        } catch (error) {
            throw new Error(`删除文件失败: ${error.message}`);
        }
    }

}