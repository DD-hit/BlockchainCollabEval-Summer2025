import express from 'express';
import { createProject, getProjectList, getProjectDetail } from '../controllers/projectManagerController.js';
const router = express.Router();

router.post('/createProject', createProject);
router.get('/getProjectList', getProjectList);
router.get('/getProjectDetail/:projectId', getProjectDetail);

export default router;