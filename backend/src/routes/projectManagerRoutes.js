import express from 'express';
import { 
    createProject, 
    getProjectList, 
    getProjectDetail, 
    updateProject, 
    deleteProject,
    getMyProjectList 
} from '../controllers/projectManagerController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/createProject', verifyToken, createProject);
router.get('/getProjectList', verifyToken, getProjectList);
router.get('/getMyProjects', verifyToken, getMyProjectList);
router.get('/getProjectDetail/:projectId', verifyToken, getProjectDetail);
router.put('/updateProject/:projectId', verifyToken, updateProject);
router.delete('/deleteProject/:projectId', verifyToken, deleteProject);



export default router;
