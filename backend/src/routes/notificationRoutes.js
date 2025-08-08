import express from 'express';
import { getNotificationList, markNotificationAsRead } from '../controllers/notificationController.js';
import { verifyToken } from '../middleware/verifyToken.js';
const router = express.Router();

router.get('/getNotificationList/:username', verifyToken, getNotificationList);
router.put('/markAsRead/:notificationId', verifyToken, markNotificationAsRead);

export default router;