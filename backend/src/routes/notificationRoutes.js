import express from 'express';
import { getNotificationList, markNotificationAsRead, markAsReadByFileId, isAllRead} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router();

router.get('/getNotificationList/:username', verifyToken, getNotificationList);
router.put('/markAsRead/:notificationId', verifyToken, markNotificationAsRead);
router.put('/markAsReadByFileId', verifyToken, markAsReadByFileId);
router.get('/isAllRead/:subtaskId', verifyToken, isAllRead);

export default router;