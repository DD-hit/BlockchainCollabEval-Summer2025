import { NotificationService } from '../services/notificationService.js';

export const getNotificationList = async (req, res) => {
    try {
        const { username } = req.params;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const notificationList = await NotificationService.getNotificationList(username.trim());
        res.json({
            success: true,
            message: '获取通知列表成功',
            data: notificationList
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        // 参数验证
        if (!notificationId || isNaN(parseInt(notificationId))) {
            return res.status(400).json({
                success: false,
                message: '通知ID必须是有效的数字'
            });
        }
        
        const result = await NotificationService.markAsRead(parseInt(notificationId));
        res.json({ success: true, message: '通知已标记为已读' });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

//根据文件ID标记通知为已读
export const markAsReadByFileId = async (req, res) => {
    try {
        const { fileId } = req.body;
        const { username } = req.user;
        
        // 参数验证
        if (!fileId || isNaN(parseInt(fileId))) {
            return res.status(400).json({
                success: false,
                message: '文件ID必须是有效的数字'
            });
        }
        
        const result = await NotificationService.markAsReadByFileId(parseInt(fileId), username);
        res.json({ success: true, message: '通知已标记为已读' });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

//是否全部已读
export const isAllRead = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        
        // 参数验证
        if (!subtaskId || isNaN(parseInt(subtaskId))) {
            return res.status(400).json({
                success: false,
                message: '子任务ID必须是有效的数字'
            });
        }
        
        const isAllRead = await NotificationService.isAllRead(parseInt(subtaskId));
        res.json({ success: true, message: '是否全部已读', data: isAllRead });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};
