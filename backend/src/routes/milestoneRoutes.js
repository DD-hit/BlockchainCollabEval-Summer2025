import express from 'express';
import { createMilestone, getMilestoneList, getMilestoneDetail, updateMilestone, deleteMilestone } from '../controllers/milestoneController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/createMilestone', verifyToken, createMilestone);
router.get('/getMilestoneList/:projectId', verifyToken, getMilestoneList);
router.get('/getMilestoneDetail/:milestoneId', verifyToken, getMilestoneDetail);
router.put('/updateMilestone/:milestoneId', verifyToken, updateMilestone);
router.delete('/deleteMilestone/:milestoneId', verifyToken, deleteMilestone);

export default router;