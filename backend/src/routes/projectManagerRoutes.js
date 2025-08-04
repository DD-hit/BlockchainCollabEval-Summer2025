import express from 'express';
import { createProject, getProjectList, getProjectDetail, getMyProjectList } from '../controllers/projectManagerController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/createProject', verifyToken, createProject);
router.get('/getProjectList', verifyToken, getProjectList);
router.get('/getProjectDetail/:projectId', verifyToken, getProjectDetail);
router.get('/getMyProjectList', verifyToken, getMyProjectList);
export default router;