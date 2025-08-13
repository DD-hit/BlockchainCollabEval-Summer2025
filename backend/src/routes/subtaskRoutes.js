import express from 'express';
import { createSubtask, getSubtaskList, getSubtaskDetail, updateSubtask, deleteSubtask, myTasks } from '../controllers/subtaskControllers.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/createSubtask', verifyToken, createSubtask);
router.get('/getSubtaskList/:milestoneId', verifyToken, getSubtaskList);
router.get('/getSubtaskDetail/:subtaskId', verifyToken, getSubtaskDetail);
router.put('/updateSubtask/:subtaskId', verifyToken, updateSubtask);
router.delete('/deleteSubtask/:subtaskId', verifyToken, deleteSubtask);
router.get('/myTasks', verifyToken, myTasks);

export default router;