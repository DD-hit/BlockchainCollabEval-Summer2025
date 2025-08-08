import express from 'express';
import { 
    createProject, 
    getProjectList, 
    getProjectDetail, 
    updateProject, 
    deleteProject,
    getMyProjects 
} from '../controllers/projectManagerController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.post('/createProject', verifyToken, createProject);
router.get('/getProjectList', verifyToken, (req, res) => {
  // 从token中获取username
  const username = req.user.username;
  ProjectManagerService.getProjectList(username)
    .then(data => res.json({ success: true, data }))
    .catch(error => res.status(500).json({ success: false, message: error.message }));
});
router.get('/getMyProjects', verifyToken, getMyProjects);
router.get('/getProjectDetail/:projectId', verifyToken, getProjectDetail);
router.put('/updateProject/:projectId', verifyToken, updateProject);
router.delete('/deleteProject/:projectId', verifyToken, deleteProject);

export default router;
