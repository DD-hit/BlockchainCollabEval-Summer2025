import express from 'express';
import { getNotificationList, markNotificationAsRead , isAllRead} from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router();

router.get('/getNotificationList/:username', verifyToken, getNotificationList);
router.put('/markAsRead/:notificationId', verifyToken, markNotificationAsRead);
router.get('/isAllRead/:subtaskId', verifyToken, isAllRead);

export default router;