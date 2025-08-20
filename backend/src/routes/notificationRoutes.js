import express from 'express';
import { 
    getNotificationList, 
    markNotificationAsRead, 
    markAsReadByFileId, 
    isAllRead,
    markAllAsRead,
    getUnreadCount,
    getAllNotifications
} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router();

router.get('/getNotificationList/:username', verifyToken, getNotificationList);
router.put('/markAsRead/:notificationId', verifyToken, markNotificationAsRead);
router.put('/markAsReadByFileId', verifyToken, markAsReadByFileId);
router.get('/isAllRead/:subtaskId', verifyToken, isAllRead);
router.put('/markAllAsRead', verifyToken, markAllAsRead);
router.get('/unreadCount', verifyToken, getUnreadCount);
router.get('/getAllNotifications', verifyToken, getAllNotifications);

export default router;