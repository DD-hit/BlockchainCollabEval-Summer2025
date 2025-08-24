import { pool } from '../../config/database.js';

export class NotificationService {
    
    static async getNotificationList(username) {

        const [result] = await pool.execute(
            `SELECT * FROM notifications WHERE receiver = ? AND isRead = 0 order by createdTime desc`,
            [username]
        );

        return result;
    }

    // 贡献度：根据 round_id 将通知发送给“已绑定本地账号”的参与者
    static async addContribRoundNotifications(roundId, sender, message = '请参与本轮贡献度评分') {
        try {
            // 参与者集合：从基础分表拿 github_login，映射到 user.username（已绑定者）
            const [rows] = await pool.execute(
                `SELECT u.username
                 FROM contrib_base_scores b
                 JOIN user u ON u.github_login = b.github_login
                 WHERE b.round_id = ?`,
                [roundId]
            );

            if (!rows || rows.length === 0) return { affected: 0 };

            let affected = 0;
            for (const r of rows) {
                const receiver = r.username;
                await pool.execute(
                    `INSERT INTO notifications (sender, receiver, type, subtaskId, fileId, content, isRead, createdTime)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [sender || 'system', receiver, 'contrib_round', 0, null, JSON.stringify({ roundId, message }), false]
                );
                affected++;
            }
            return { affected };
        } catch (error) {
            throw new Error(`添加贡献度轮次通知失败: ${error.message}`);
        }
    }

    // GitHub贡献（新合约）：发送互评邀请通知，区分于旧评分逻辑
    static async addGitHubContribRoundNotifications(roundId, repoId, contractAddress, sender, message = '请参与本轮GitHub贡献互评') {
        try {
            const [rows] = await pool.execute(
                `SELECT u.username
                 FROM contrib_base_scores b
                 JOIN user u ON u.github_login = b.github_login
                 WHERE b.round_id = ?`,
                [roundId]
            );
            if (!rows || rows.length === 0) return { affected: 0 };

            let affected = 0;
            for (const r of rows) {
                const receiver = r.username;
                const content = { roundId, repoId, contractAddress, message };
                await pool.execute(
                    `INSERT INTO notifications (sender, receiver, type, subtaskId, fileId, content, isRead, createdTime)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [sender || 'system', receiver, 'github_contrib_round', 0, null, JSON.stringify(content), false]
                );
                affected++;
            }
            return { affected };
        } catch (error) {
            throw new Error(`添加GitHub贡献互评通知失败: ${error.message}`);
        }
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

    // 删除用户所有通知
    static async deleteAllNotifications(username) {
        try {
            const [result] = await pool.execute(
                `DELETE FROM notifications WHERE receiver = ?`,
                [username]
            );
            return result;
        } catch (error) {
            throw new Error(`删除所有通知失败: ${error.message}`);
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