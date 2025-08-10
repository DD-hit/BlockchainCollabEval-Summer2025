import { pool } from '../../config/database.js';

export class NotificationService {
    
    static async getNotificationList(username) {
        const [result] = await pool.execute(
            `SELECT * FROM notifications WHERE receiver = ? AND isRead = 0 order by createdTime desc`,
            [username]
        );
        return result;
    }

    static async addFileNotification(sender, receiver, projectId, fileId) {
        try {
            const [fileInfo] = await pool.execute(
                `SELECT * FROM files WHERE id = ?`,
                [fileId]
            );
            const contractAddress = fileInfo[0].address;
            const content = {
                contractAddress: contractAddress,
                fileName: fileInfo[0].fileName,
                fileSize: fileInfo[0].fileSize,
                fileType: fileInfo[0].fileType,
                fileHash: fileInfo[0].fileHash,
                uploadTime: fileInfo[0].uploadTime
            }
            const [result] = await pool.execute(
                `INSERT INTO notifications (sender, receiver, type, projectId, fileId,content,isRead,createdTime) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [sender, receiver, 'file', projectId, fileId, content, false]
            );
            return result;
        } catch (error) {
            throw new Error(`添加文件通知失败: ${error.message}`);
        }
    }

    static async markAsRead(notificationId) {
        try {
            const [result] = await pool.execute(
                `UPDATE notifications SET isRead = 1 WHERE id = ?`,
                [notificationId]
            );
            return result;
        } catch (error) {
            throw new Error(`标记通知为已读失败: ${error.message}`);
        }
    }

}