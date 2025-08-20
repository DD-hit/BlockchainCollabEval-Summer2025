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

// 标记所有通知为已读
export const markAllAsRead = async (req, res) => {
    try {
        const { username } = req.user;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const result = await NotificationService.markAllAsRead(username.trim());
        res.json({ 
            success: true, 
            message: '所有通知已标记为已读',
            data: result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// 获取未读通知数量
export const getUnreadCount = async (req, res) => {
    try {
        const { username } = req.user;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const count = await NotificationService.getUnreadCount(username.trim());
        res.json({ 
            success: true, 
            message: '获取未读通知数量成功',
            data: { unreadCount: count }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// 获取所有通知（包括已读和未读）
export const getAllNotifications = async (req, res) => {
    try {
        const { username } = req.user;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const notifications = await NotificationService.getAllNotifications(username.trim());
        res.json({ 
            success: true, 
            message: '获取所有通知成功',
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// 删除用户所有通知
export const deleteAllNotifications = async (req, res) => {
    try {
        const { username } = req.user;
        
        // 参数验证
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const result = await NotificationService.deleteAllNotifications(username.trim());
        res.json({ 
            success: true, 
            message: '所有通知已删除',
            data: result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};
