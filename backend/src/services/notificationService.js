import { pool } from '../../config/database.js';

export class NotificationService {
    
    static async getNotificationList(username) {

        const [result] = await pool.execute(
            `SELECT * FROM notifications WHERE receiver = ? AND isRead = 0 order by createdTime desc`,
            [username]
        );

        return result;
    }

    static async addFileNotification(sender, receiver, subtaskId, fileId) {
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
                uploadTime: fileInfo[0].uploadTime,
                subtaskId: fileInfo[0].subtaskId
            }
            const [result] = await pool.execute(
                `INSERT INTO notifications (sender, receiver, type, subtaskId, fileId, content, isRead, createdTime) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [sender, receiver, 'file', subtaskId, fileId, JSON.stringify(content), false]
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

    static async markAsReadByFileId(fileId, receiver) {
        try {
            const [result] = await pool.execute(
                `UPDATE notifications SET isRead = 1 WHERE fileId = ? AND receiver = ?`,
                [fileId, receiver]
            );
            return result;
        } catch (error) {
            throw new Error(`根据文件ID标记通知为已读失败: ${error.message}`);
        }
    }

    static async isAllRead(subtaskId) {
        const [result] = await pool.execute(
            `SELECT COUNT(*) as count FROM notifications WHERE subtaskId = ? AND isRead = 0`,
            [subtaskId]
        );
        return result[0].count === 0;
    }

    // 标记用户所有通知为已读
    static async markAllAsRead(username) {
        try {
            const [result] = await pool.execute(
                `UPDATE notifications SET isRead = 1 WHERE receiver = ?`,
                [username]
            );
            return result;
        } catch (error) {
            throw new Error(`标记所有通知为已读失败: ${error.message}`);
        }
    }

    // 获取用户未读通知数量
    static async getUnreadCount(username) {
        try {
            const [result] = await pool.execute(
                `SELECT COUNT(*) as count FROM notifications WHERE receiver = ? AND isRead = 0`,
                [username]
            );
            return result[0].count;
        } catch (error) {
            throw new Error(`获取未读通知数量失败: ${error.message}`);
        }
    }

    // 获取用户所有通知（包括已读和未读）
    static async getAllNotifications(username) {
        try {
            const [result] = await pool.execute(
                `SELECT * FROM notifications WHERE receiver = ? ORDER BY createdTime DESC`,
                [username]
            );
            return result;
        } catch (error) {
            throw new Error(`获取所有通知失败: ${error.message}`);
        }
    }

    static async addSubtaskStatusNotification(sender, receiver, subtaskId, title, status, milestoneId) {
        try {
            const content = {
                subtaskId: subtaskId,
                title: title,
                status: status,
                milestoneId: milestoneId,
                updateTime: new Date().toISOString()
            };
            
            const [result] = await pool.execute(
                `INSERT INTO notifications (sender, receiver, type, subtaskId, content, isRead, createdTime) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [sender, receiver, 'subtask_status', subtaskId, JSON.stringify(content), false]
            );
            
    
            return result;
        } catch (error) {
            throw new Error(`添加子任务状态通知失败: ${error.message}`);
        }
    }

}