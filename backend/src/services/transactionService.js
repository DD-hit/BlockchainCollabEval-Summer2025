import { pool } from '../../config/database.js';

export class TransactionService {
    /**
     * 创建交易记录
     */
    static async createTransaction(transactionData) {
        const {
            transactionHash,
            type,
            username,
            address,
            subtaskId,
            fileId,
            contractAddress,
            description,
            details,
            blockNumber,
            gasUsed,
            status = 'success'
        } = transactionData;

        const [result] = await pool.execute(
            `INSERT INTO transactions (
                transactionHash, type, username, address, subtaskId, 
                fileId, contractAddress, description, details, 
                blockNumber, gasUsed, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                transactionHash || null,
                type,
                username,
                address || null,
                subtaskId || null,
                fileId || null,
                contractAddress || null,
                description || null,
                details ? JSON.stringify(details) : null,
                blockNumber || null,
                gasUsed || null,
                status
            ]
        );

        return result.insertId;
    }

    /**
     * 获取最近的交易记录
     */
    static async getRecentTransactions(limit = 10) {
        const limitNum = parseInt(limit) || 10;
        const [result] = await pool.execute(
            `SELECT * FROM transactions 
             ORDER BY createdAt DESC 
             LIMIT ${limitNum}`
        );

        return result;
    }

    /**
     * 获取交易统计信息
     */
    static async getTransactionStats() {
        const [result] = await pool.execute(
            `SELECT 
                COUNT(*) as totalTransactions,
                COUNT(CASE WHEN status = 'success' THEN 1 END) as successfulTransactions,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedTransactions,
                COUNT(CASE WHEN type = 'file_upload' THEN 1 END) as fileUploads,
                COUNT(CASE WHEN type = 'score' THEN 1 END) as scores
             FROM transactions`
        );

        return result[0];
    }

    /**
     * 记录文件上传交易
     */
    static async recordFileUpload(fileData, transactionHash = null, blockNumber = null, gasUsed = null) {
        const description = `上传文件: ${fileData.originalName}`;
        const details = {
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            fileType: fileData.fileType,
            fileHash: fileData.fileHash
        };

        return await this.createTransaction({
            transactionHash: transactionHash || null,
            type: 'file_upload',
            username: fileData.username,
            address: fileData.address || null,
            subtaskId: fileData.subtaskId || null,
            fileId: fileData.fileId || null,
            contractAddress: fileData.contractAddress || null,
            description: description || null,
            details,
            blockNumber: blockNumber || null,
            gasUsed: gasUsed || null,
            status: 'success'
        });
    }

    /**
     * 记录评分交易
     */
    static async recordScore(scoreData, transactionHash, blockNumber, gasUsed) {
        const description = `对文件进行评分: ${scoreData.score}分`;
        const details = {
            score: scoreData.score,
            contractAddress: scoreData.contractAddress,
            scorer: scoreData.scorer
        };

        return await this.createTransaction({
            transactionHash,
            type: 'score',
            username: scoreData.username,
            address: scoreData.address,
            subtaskId: null,
            fileId: null,
            contractAddress: scoreData.contractAddress,
            description,
            details,
            blockNumber,
            gasUsed,
            status: 'success'
        });
    }
}
