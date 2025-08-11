import { NotificationService } from '../services/notificationService.js';

export const getNotificationList = async (req, res) => {
    try {
        const { username } = req.params;
        const notificationList = await NotificationService.getNotificationList(username);
        res.json(notificationList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const result = await NotificationService.markAsRead(notificationId);
        res.json({ success: true, message: '通知已标记为已读' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//是否全部已读
export const isAllRead = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const isAllRead = await NotificationService.isAllRead(subtaskId);
        res.json({ success: true, message: '是否全部已读', data: isAllRead });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
